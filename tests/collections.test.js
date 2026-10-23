import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { StateStore, testing } from '../plugin.js'

async function withStore(run) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-collections-'))
  const file = join(root, 'state.json')
  try {
    const store = new StateStore(file)
    await store.init()
    await run(store, file)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

const payload = {
  platform: 'bilibili', folder: '研究方法',
  sourceUrl: 'https://space.bilibili.com/123/favlist?fid=456',
  items: [{ title: '如何规划实验', description: '先确定目标，再选择指标。', tags: ['研究'], bvid: 'BV123' }],
}
const records = [{ kind: 'pattern', genre: '攻略', domain: '研究/实验', title: '实验设计', content: '实验规划需要把目标和评估指标联系起来。', tags: ['方法'] }]
const route = { parseProvider: 'test-provider', parseModel: 'test-model' }
function llmFor(output = { records }, calls = []) {
  return {
    async *stream(options) {
      calls.push(options)
      yield { type: 'text-delta', text: JSON.stringify(output) }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }
}
function panelFor(store, llm, fetchImpl) {
  return testing.createAssistantPanel({
    store, llm, fetchImpl, overlay: { values: null },
    readConfig: () => testing.resolvedConfig(route), persist: async () => {},
  })
}
async function waitForAnalysis(store) {
  for (let i = 0; i < 100; i++) {
    if (store.snapshot().collections.every(item => item.status !== 'analyzing')) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.fail('collection analysis did not finish')
}

test('local v6 state migrates without losing proactive sources, tasks, knowledge, or favorites', async () => {
  await withStore(async (store, file) => {
    await store.update(state => {
      testing.applyProactiveSourceCreate(state, { key: 'mail.travel', label: '行程', purpose: '行程变化', capability_query: 'mail travel', origin: 'owner', enabled: true })
      testing.applyFavoritesAdd(state, { sessionId: 's', messageId: 'm', stars: 4, snapshot: '回复' })
      testing.applyKnowledgeCreate(state, { ...records[0], basis: 'stated', confidence: 1, source: 'owner' })
    })
    await testing.taskTool(store).execute({ action: 'create', title: '准备实验' })
    const legacy = store.snapshot()
    legacy.version = 6
    delete legacy.collections
    await writeFile(file, JSON.stringify(legacy))
    const reopened = new StateStore(file)
    await reopened.init()
    assert.deepEqual(reopened.snapshot(), { ...legacy, version: 11, collections: [] })
    assert.equal(JSON.parse(await readFile(file, 'utf8')).version, 11)
  })
})

test('colleague v7 state migrates with its imported folders and linked knowledge intact', async () => {
  await withStore(async (store, file) => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, payload))
    await testing.markAnalyzing(store, [folder.id])
    await testing.applyCollectionAnalysisToStore(store, folder.id, records)
    const legacy = store.snapshot()
    legacy.version = 7
    delete legacy.proactiveSources
    await writeFile(file, JSON.stringify(legacy))
    const reopened = new StateStore(file)
    await reopened.init()
    assert.deepEqual(reopened.snapshot(), { ...legacy, version: 11, proactiveSources: [] })
  })
})

test('migration rejects unknown legacy fields without rewriting the original data', async () => {
  await withStore(async (store, file) => {
    const legacy = { ...store.snapshot(), version: 6, unexpected: 'keep me' }
    delete legacy.collections
    const source = JSON.stringify(legacy)
    await writeFile(file, source)
    await assert.rejects(new StateStore(file).init(), /unknown field: unexpected/)
    assert.equal(await readFile(file, 'utf8'), source)
  })
})

test('Bilibili URL parsing accepts supported links and rejects foreign hosts and schemes', () => {
  for (const url of [payload.sourceUrl, 'https://www.bilibili.com/medialist/detail/ml456', 'https://www.bilibili.com/list?media_id=456']) {
    assert.equal(testing.parseBilibiliFavUrl(url).fid, '456')
  }
  for (const url of ['https://bilibili.com.example.org/?fid=456', 'file://space.bilibili.com/123?fid=456', 'https://www.bilibili.com/?fid=abc']) {
    assert.equal(testing.parseBilibiliFavUrl(url), null)
  }
  assert.equal(testing.isBilibiliShareLink('https://b23.tv/example'), true)
  assert.equal(testing.isBilibiliShareLink('ftp://b23.tv/example'), false)
})

test('panel imports short links, paginates, drops invalid videos, and never persists cookies', async () => {
  await withStore(async (store, file) => {
    const calls = []
    const fetchImpl = async (raw, options) => {
      const url = new URL(raw)
      calls.push({ url, options })
      if (url.hostname === 'b23.tv') return { ok: true, url: payload.sourceUrl }
      if (url.pathname.includes('view/detail')) return { ok: true, json: async () => ({ code: 0, data: { View: { desc: '简介', stat: { like: 12 } }, Tags: [{ tag_name: '研究' }] } }) }
      const page = Number(url.searchParams.get('pn'))
      return { ok: true, json: async () => ({ code: 0, data: {
        info: { id: 456, title: payload.folder, media_count: 3 }, has_more: page === 1,
        medias: page === 1
          ? [{ title: '有效视频', bvid: 'BV123', page: 1, attr: 0 }, { title: '已失效视频', attr: 0, page: 1 }]
          : [{ title: '另一个视频', bvid: 'BV456', page: 1, attr: 0 }],
      } }) }
    }
    const panel = panelFor(store, null, fetchImpl)
    const result = await panel.action({ type: 'collections.parseLink', url: 'https://b23.tv/example', cookie: 'SESSDATA=private-value' })
    assert.equal(result.linkResult.valid, 2)
    assert.equal(result.linkResult.dropped, 1)
    assert.equal(result.collections.collectionCount, 1)
    assert.equal(result.collections.collections[0].items[0].like, 12)
    assert.deepEqual(result.collections.collections[0].items[0].tags, ['研究'])
    assert.equal(calls[0].options.headers.cookie, undefined)
    assert.equal(calls.slice(1).every(call => call.options.headers.cookie === 'SESSDATA=private-value'), true)
    assert.doesNotMatch(await readFile(file, 'utf8'), /SESSDATA|private-value/)
    await panel.action({ type: 'collections.parseLink', url: 'https://b23.tv/example' })
    assert.equal(store.snapshot().collections.length, 1)
    assert.equal(store.snapshot().collections[0].status, 'pending')
    assert.equal((await panel.snapshot()).proactiveSources.sourceCount, 0)
    await assert.rejects(panel.action({ type: 'collections.parseLink', url: 'https://example.org' }), /暂不支持/)
  })
})

test('API errors are explicit and optional video detail failures keep the imported metadata', async () => {
  await assert.rejects(testing.fetchBilibiliFavorites('456', { fetchImpl: async () => ({ ok: true, json: async () => ({ code: -403 }) }) }), /收藏夹不可见/)
  const items = [{ title: '视频', bvid: 'BV123' }]
  await testing.attachBilibiliDetails(items, { fetchImpl: async () => { throw new Error('offline') } })
  assert.deepEqual(items, [{ title: '视频', bvid: 'BV123' }])
})

test('import counters can record more invalid entries than the valid-item limit', async () => {
  await withStore(async store => {
    await store.update(state => testing.applyCollectionsImport(state, { ...payload, fetched: 500, dropped: 499 }))
    assert.equal(store.snapshot().collections[0].dropped, 499)
  })
})

test('re-import preserves the folder id, accepts absent author, and makes new contents parseable', async () => {
  await withStore(async store => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, payload))
    await testing.markAnalyzing(store, [folder.id])
    await testing.applyCollectionAnalysisToStore(store, folder.id, records)
    const replacement = await store.update(state => testing.applyCollectionsImport(state, { ...payload, items: [{ title: '新内容', author: '作'.repeat(150) }] }))
    assert.equal(replacement.replaced, true)
    assert.equal(replacement.folder.id, folder.id)
    assert.equal(replacement.folder.status, 'pending')
    assert.equal(replacement.folder.items[0].author.length, 100)
    assert.equal(store.snapshot().collections.length, 1)
    assert.equal(store.snapshot().knowledge.length, 1)
  })
})

test('folder parsing works with a lazy model service and re-parsing replaces knowledge', async () => {
  await withStore(async store => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, { ...payload, folder: '研'.repeat(80) }))
    const calls = []
    const panel = panelFor(store, () => llmFor({ records }, calls))
    for (const type of ['collections.analyzeAll', 'collections.analyze']) {
      await panel.action({ type, id: folder.id })
      await waitForAnalysis(store)
      assert.equal(store.snapshot().collections[0].status, 'analyzed')
      assert.equal(store.snapshot().knowledge.length, 1)
      assert.equal(store.snapshot().knowledge[0].basis, 'imported')
      assert.equal(store.snapshot().knowledge[0].source, `collection:${folder.id}`)
    }
    assert.equal(calls.length, 2)
    assert.equal(calls[0].provider, route.parseProvider)
    assert.match(calls[0].messages[0].content[0].text, /如何规划实验/)
    assert.equal(calls[0].maxTokens, 10240)
  })
})

test('collection-only queues fail cleanly on missing or misconfigured model routes', async () => {
  await withStore(async store => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, payload))
    for (const [llm, config] of [[null, route], [llmFor(), { parseProvider: 'only-provider' }]]) {
      testing.resetParseRouteCache()
      await testing.markAnalyzing(store, [folder.id])
      const result = await testing.startAnalysis(llm, store, config)
      assert.equal(result.started, false)
      assert.equal(store.snapshot().collections[0].status, 'failed')
      assert.ok(store.snapshot().collections[0].analyzeError)
    }
    await testing.failAnalysis(store, folder.id, '  ')
    assert.equal(store.snapshot().collections[0].analyzeError, 'analysis failed')
  })
})

test('conversation favorites and collections share the queue without skipping either type', async () => {
  await withStore(async store => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, payload))
    const { favorite } = await store.update(state => testing.applyFavoritesAdd(state, { sessionId: 's', messageId: 'm', stars: 5, snapshot: '一条值得保留的回复' }))
    await testing.markAnalyzing(store, [folder.id, favorite.id])
    const calls = []
    const llm = { async *stream(options) {
      calls.push(options)
      yield { type: 'text-delta', text: JSON.stringify({ records, preferences: [] }) }
      yield { type: 'finish', reason: { kind: 'stop' } }
    } }
    const result = await testing.startAnalysis(llm, store, route)
    assert.equal(result.processed, 2)
    assert.equal(store.snapshot().favorites[0].status, 'analyzed')
    assert.equal(store.snapshot().collections[0].status, 'analyzed')
    assert.equal(store.snapshot().knowledge.length, 2)
    assert.match(calls[0].system, /收藏对话蒸馏器/)
  })
})

test('a failed re-parse preserves existing knowledge and retry succeeds', async () => {
  await withStore(async store => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, payload))
    await testing.markAnalyzing(store, [folder.id])
    await testing.startAnalysis(llmFor(), store, route)
    const original = store.snapshot().knowledge
    await testing.markAnalyzing(store, [folder.id])
    await testing.startAnalysis(llmFor({ records: [] }), store, route)
    assert.equal(store.snapshot().collections[0].status, 'failed')
    assert.deepEqual(store.snapshot().knowledge, original)
    await testing.markAnalyzing(store, [folder.id])
    await testing.startAnalysis(llmFor(), store, route)
    assert.equal(store.snapshot().knowledge.length, 1)
    assert.notEqual(store.snapshot().knowledge[0].id, original[0].id)
  })
})

test('clearing folders removes only their knowledge and discards late parse results', async () => {
  await withStore(async store => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, payload))
    await testing.markAnalyzing(store, [folder.id])
    await testing.applyCollectionAnalysisToStore(store, folder.id, records)
    const kept = await store.update(state => testing.applyKnowledgeCreate(state, { ...records[0], basis: 'stated', confidence: 1, source: 'owner' }))
    const result = await store.update(state => testing.applyCollectionsRemoveAll(state))
    assert.deepEqual(result, { removed: 1, removedKnowledge: 1, removedPreferences: 0 })
    assert.deepEqual(store.snapshot().knowledge, [kept.knowledge])
    assert.equal(store.snapshot().collections.length, 0)
    assert.deepEqual(await testing.applyCollectionAnalysisToStore(store, folder.id, records), { applied: false })
  })
})

test('re-parsing and clearing respect explicit references to existing knowledge', async () => {
  await withStore(async store => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, payload))
    await testing.markAnalyzing(store, [folder.id])
    const result = await testing.applyCollectionAnalysisToStore(store, folder.id, records)
    await store.update(state => testing.applyKnowledgeCreate(state, { ...records[0], basis: 'stated', confidence: 1, source: 'owner', related_ids: result.knowledgeIds }))
    const before = store.snapshot()
    await assert.rejects(store.update(state => testing.applyCollectionsRemoveAll(state)), /still referenced/)
    assert.deepEqual(store.snapshot(), before)
    await testing.markAnalyzing(store, [folder.id])
    await testing.startAnalysis(llmFor(), store, route)
    assert.equal(store.snapshot().collections[0].status, 'failed')
    assert.equal(store.snapshot().knowledge.length, 2)
  })
})

test('collection import validates payloads and token budgets are enforced in both languages', () => {
  for (const item of [null, {}, { title: 42 }, { title: 'test', unexpected: true }]) {
    assert.throws(() => testing.applyCollectionsImport(testing.createEmptyState(), { ...payload, items: [item] }))
  }
  assert.ok(testing.estimateTokens('研究') > testing.estimateTokens('ab'))
  assert.throws(() => testing.applyFavoritesAdd(testing.createEmptyState(), {
    sessionId: 's', messageId: 'm', stars: 3, snapshot: '研'.repeat(2500),
  }), /2048 estimated tokens/)
})
