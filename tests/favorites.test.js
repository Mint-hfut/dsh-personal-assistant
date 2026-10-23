import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { StateStore, testing } from '../plugin.js'

async function withStore(run) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-personal-assistant-favorites-'))
  const file = join(root, 'state.json')
  try {
    const store = new StateStore(file)
    await store.init()
    await run(store, file)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('version 4 owner state gains an empty favorites ledger without changing existing records', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-personal-assistant-v4-'))
  const file = join(root, 'state.json')
  const at = '2026-10-13T00:00:00.000Z'
  const legacy = {
    version: 4,
    preferences: [{ id: 'pref-v4', key: 'travel.seat', value: 'Window seat', category: 'travel', confidence: 1, source: 'owner statement', createdAt: at, updatedAt: at }],
    knowledge: [{ id: 'know-v4', kind: 'event', title: 'Trip', content: 'Planned rail', basis: 'stated', confidence: 1, sensitivity: 'normal', status: 'active', retention: 'long_term', source: 'conversation', createdAt: at, updatedAt: at }],
    tasks: [],
    workflows: [],
    routine: null,
    updatedAt: at,
  }
  try {
    await writeFile(file, JSON.stringify(legacy))
    const store = new StateStore(file)
    await store.init()
    const state = store.snapshot()
    assert.equal(state.version, 11)
    assert.deepEqual(state.proactiveSources, [])
    assert.deepEqual(state.favorites, [])
    assert.deepEqual(state.preferences, legacy.preferences)
    assert.deepEqual(state.knowledge, legacy.knowledge)
    assert.equal(JSON.parse(await readFile(file, 'utf8')).version, 11)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('favorites upsert by message target and persist across reopen', async () => {
  await withStore(async (store, file) => {
    const first = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a',
      messageId: 'msg-1',
      stars: 3,
      note: '详细对比表格有用',
      snapshot: '推荐两个方案并给出对比',
      question: '两个方案怎么选？',
    }))
    assert.equal(first.added, true)
    assert.equal(first.favorite.status, 'pending')
    assert.equal(first.favorite.stars, 3)
    assert.equal(first.favorite.question, '两个方案怎么选？')
    assert.match(first.favorite.id, /^fav-/)

    const second = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a',
      messageId: 'msg-1',
      stars: 5,
      note: '',
      snapshot: '推荐两个方案并给出对比',
    }))
    assert.equal(second.added, false)
    assert.equal(second.favorite.id, first.favorite.id)
    assert.equal(second.favorite.stars, 5)

    const reopened = new StateStore(file)
    await reopened.init()
    const state = reopened.snapshot()
    assert.equal(state.favorites.length, 1)
    assert.equal(state.favorites[0].stars, 5)
    assert.equal(state.favorites[0].messageId, 'msg-1')
  })
})

test('favorites are scoped per session and listed newest first', async () => {
  await withStore(async (store) => {
    for (const [sessionId, messageId, stars] of [
      ['session-a', 'msg-1', 1],
      ['session-a', 'msg-2', 2],
      ['session-b', 'msg-9', 4],
    ]) {
      await store.update(state => testing.applyFavoritesAdd(state, { sessionId, messageId, stars }))
    }
    await store.update(state => {
      // 显式固定时间戳，避免同毫秒创建导致排序断言偶发失败。
      const byMessage = Object.fromEntries(state.favorites.map(item => [item.messageId, item]))
      byMessage['msg-1'].updatedAt = '2026-10-10T00:00:00.000Z'
      byMessage['msg-2'].updatedAt = '2026-10-11T00:00:00.000Z'
      byMessage['msg-9'].updatedAt = '2026-10-12T00:00:00.000Z'
      return { favorites: state.favorites }
    })
    const scoped = testing.favoritesForSession(store.snapshot().favorites, 'session-a')
    assert.equal(scoped.favoriteCount, 2)
    assert.deepEqual(scoped.favorites.map(item => item.messageId), ['msg-2', 'msg-1'])
    const recent = testing.recentFavorites(store.snapshot().favorites, 10)
    assert.equal(recent.favoriteCount, 3)
    assert.deepEqual(recent.favorites.map(item => item.messageId), ['msg-9', 'msg-2', 'msg-1'])
  })
})

test('favorites removal deletes only the matching target', async () => {
  await withStore(async (store) => {
    for (const [sessionId, messageId] of [['session-a', 'msg-1'], ['session-a', 'msg-2']]) {
      await store.update(state => testing.applyFavoritesAdd(state, { sessionId, messageId, stars: 2 }))
    }
    const removed = await store.update(state => testing.applyFavoritesRemove(state, { sessionId: 'session-a', messageId: 'msg-1' }))
    assert.equal(removed.removed, true)
    assert.equal(removed.favorite.messageId, 'msg-1')
    assert.equal(store.snapshot().favorites.length, 1)
    assert.equal(store.snapshot().favorites[0].messageId, 'msg-2')
    const missing = await store.update(state => testing.applyFavoritesRemove(state, { sessionId: 'session-a', messageId: 'msg-1' }))
    assert.equal(missing.removed, false)
  })
})

test('favorites validation rejects bad stars, oversize fields, and duplicate targets', async () => {
  await withStore(async (store) => {
    const base = { sessionId: 'session-a', messageId: 'msg-1', stars: 3 }
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), { ...base, stars: 0 }), /stars must be an integer from 1 through 5/)
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), { ...base, stars: 6 }), /stars must be an integer from 1 through 5/)
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), { ...base, stars: 1.5 }), /stars must be an integer from 1 through 5/)
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), { ...base, note: 'x'.repeat(801) }), /note must be at most 800 characters/)
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), { ...base, snapshot: 'x'.repeat(4 * testing.FAVORITE_LIMITS.replyTokens + 1) }), /snapshot must be at most 8192 characters/)
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), { ...base, kind: 'session' }), /kind has an invalid value/)
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), { ...base, reasons: ['taste'] }), /reasons item has an invalid value/)
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), { sessionId: 'session-a' }), /messageId is required/)
    const defaulted = testing.applyFavoritesAdd(store.snapshot(), { sessionId: 'session-a', messageId: 'msg-default', stars: 3 })
    assert.deepEqual(defaulted.favorite.reasons, [])
  })

  const root = await mkdtemp(join(tmpdir(), 'dsh-personal-assistant-fav-invalid-'))
  const file = join(root, 'state.json')
  try {
    const state = testing.createEmptyState()
    const at = '2026-10-13T00:00:00.000Z'
    const one = { id: 'fav-one', kind: 'message', sessionId: 'session-a', messageId: 'msg-1', stars: 2, category: 'other', status: 'pending', createdAt: at, updatedAt: at }
    const duplicate = { ...one, id: 'fav-two' }
    state.favorites.push(one, duplicate)
    await writeFile(file, JSON.stringify(state))
    await assert.rejects(new StateStore(file).init(), /duplicate favorite target/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('version 5 favorites without a category are backfilled and popup-tainted snapshots are cleared on load', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-personal-assistant-fav-backfill-'))
  const file = join(root, 'state.json')
  const at = '2026-10-13T00:00:00.000Z'
  try {
    const legacy = testing.createEmptyState()
    legacy.version = 5
    delete legacy.proactiveSources
    delete legacy.collections
    legacy.favorites = [
      { id: 'fav-old', kind: 'message', sessionId: 'session-a', messageId: 'msg-1', stars: 4, status: 'pending', createdAt: at, updatedAt: at },
      { id: 'fav-tainted', kind: 'message', sessionId: 'session-a', messageId: 'msg-2', stars: 3, category: 'method', status: 'pending', snapshot: '收藏这条回复星级表示您对回复方式的喜好程度，影响解析优先级。正文内容收藏取消用量 13.5M', createdAt: at, updatedAt: at },
      { id: 'fav-clean', kind: 'message', sessionId: 'session-a', messageId: 'msg-3', stars: 5, category: 'idea', status: 'pending', snapshot: '一段正常的回复正文', createdAt: at, updatedAt: at },
    ]
    await writeFile(file, JSON.stringify(legacy))
    const store = new StateStore(file)
    await store.init()
    assert.equal(store.snapshot().version, 11)
    assert.deepEqual(store.snapshot().proactiveSources, [])
    const favorites = store.snapshot().favorites
    const byId = Object.fromEntries(favorites.map(favorite => [favorite.id, favorite]))
    assert.deepEqual(byId['fav-old'].reasons, [])
    assert.equal(byId['fav-old'].snapshot, undefined)
    assert.deepEqual(byId['fav-tainted'].reasons, ["process"])
    assert.equal(byId['fav-tainted'].snapshot, undefined)
    assert.equal(byId['fav-clean'].snapshot, '一段正常的回复正文')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('1000 favorites persist and the record limit still permits editing existing favorites', async () => {
  await withStore(async (store, file) => {
    await store.update(state => {
      for (let index = 0; index < 1000; index += 1) {
        testing.applyFavoritesAdd(state, { sessionId: 'session-a', messageId: `msg-${index}`, stars: 1 })
      }
    })
    const edited = await store.update(state => testing.applyFavoritesAdd(state, { sessionId: 'session-a', messageId: 'msg-0', stars: 5, note: 'Updated at capacity' }))
    assert.equal(edited.added, false)
    assert.equal(edited.favorite.stars, 5)
    await assert.rejects(
      store.update(state => testing.applyFavoritesAdd(state, { sessionId: 'session-a', messageId: 'msg-1000', stars: 1 })),
      /favorites limit 1000 reached/,
    )
    const reopened = new StateStore(file)
    await reopened.init()
    assert.equal(reopened.snapshot().favorites.length, 1000)
    assert.equal(reopened.snapshot().favorites.find(item => item.messageId === 'msg-0').note, 'Updated at capacity')
  })
})

function fakeLlm(output, { provider = 'fake-provider', model = 'fake-model' } = {}) {
  return {
    listProviders: () => [{ id: provider, name: 'Fake provider' }],
    listModels: async () => [{ id: model, name: 'Fake model' }],
    stream: async function* (options) {
      // 对齐真实适配器（llm-pi-ai）：GenerateOptions.stop 只要存在就报错，空数组也算。
      if (options?.stop !== undefined) {
        throw new Error('llm-pi-ai does not support GenerateOptions.stop')
      }
      yield { type: 'text-delta', index: 0, text: output }
      yield { type: 'usage', usage: { inputTokens: 10, outputTokens: 5 } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }
}

const GOOD_OUTPUT = JSON.stringify({ records: [{
  genre: '攻略', domain: '技术/数据库',
  kind: 'pattern',
  title: '数据库迁移三步法',
  content: '分三步完成迁移：先备份，再改表，最后校验。',
  evidence: '回复给出了具体的执行步骤。',
  tags: ['迁移', '备份'],
}], preferences: [] })

const ROUTE = { provider: 'fake-provider', model: 'fake-model' }

test('panel favorites actions mutate the shared store', async () => {
  await withStore(async (store, file) => {
    const base = testing.resolvedConfig({})
    const reader = testing.liveConfigReader(base, () => null).read
    const panel = testing.createAssistantPanel({
      overlay: { values: null },
      readConfig: reader,
      persist: async () => {},
      store,
      llm: fakeLlm(GOOD_OUTPUT),
    })
    const added = await panel.action({
      type: 'favorites.add',
      sessionId: 'session-a',
      messageId: 'msg-1',
      stars: 4,
      category: 'method',
      note: '方案 B 的思路更好',
      snapshot: '给出两个候选方案',
      question: '选哪个方案更稳妥？',
    })
    assert.equal(added.favorites.favoriteCount, 1)
    assert.equal(added.favorites.favorites[0].stars, 4)
    assert.deepEqual(added.favorites.favorites[0].reasons, ["process"])
    assert.equal(added.favorites.favorites[0].question, '选哪个方案更稳妥？')
    const scoped = await panel.action({ type: 'favorites.list', sessionId: 'session-a' })
    assert.equal(scoped.favorites.favoriteCount, 1)
    assert.equal(scoped.favorites.favorites[0].note, '方案 B 的思路更好')
    assert.deepEqual(scoped.favorites.favorites[0].reasons, ["process"])
    const pending = await panel.action({ type: 'favorites.analyze', id: added.favorites.favorites[0].id })
    assert.equal(pending.favorites.favorites[0].status, 'analyzing')
    await testing.runAnalysisQueue(fakeLlm(GOOD_OUTPUT), store, ROUTE)
    const analyzed = await panel.action({ type: 'favorites.list' })
    assert.equal(analyzed.favorites.favorites[0].status, 'analyzed')
    assert.equal(analyzed.favorites.favorites[0].knowledgeIds.length, 1)
    assert.ok(analyzed.knowledge.knowledge.some(record => record.id === analyzed.favorites.favorites[0].knowledgeIds[0]))
    const removed = await panel.action({ type: 'favorites.remove', sessionId: 'session-a', messageId: 'msg-1' })
    assert.equal(removed.favorites.favoriteCount, 0)
    assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).favorites, [])
  })
})

test('favorites persist the execution process and accept result/expression categories', async () => {
  await withStore(async (store, file) => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a',
      messageId: 'msg-1',
      stars: 4,
      category: 'result',
      snapshot: '最终输出',
      question: '问题',
      process: '思考：先查文档。\n工具：read_file → bash',
    }))
    assert.deepEqual(added.favorite.reasons, ["output"])
    assert.equal(added.favorite.process, '思考：先查文档。\n工具：read_file → bash')
    const expression = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-2', stars: 3, category: 'expression', snapshot: '回复',
    }))
    assert.deepEqual(expression.favorite.reasons, ["expression"])
    const reopened = new StateStore(file)
    await reopened.init()
    const byMessage = Object.fromEntries(reopened.snapshot().favorites.map(item => [item.messageId, item]))
    assert.equal(byMessage['msg-1'].process, '思考：先查文档。\n工具：read_file → bash')
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), {
      sessionId: 'session-a', messageId: 'msg-3', stars: 1, process: 'x'.repeat(4 * testing.FAVORITE_LIMITS.processTokens + 1),
    }), /process must be at most 65536 characters/)
  })
})

test('favorites store the conversation turn number and expose it in summaries', async () => {
  await withStore(async (store, file) => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-turn', stars: 3, category: 'idea', snapshot: '回复', turn: 7,
    }))
    assert.equal(added.favorite.turn, 7)
    const summary = testing.favoriteSummary(added.favorite)
    assert.equal(summary.turn, 7)
    // 未采集到轮次时字段缺省（旧收藏兼容）。
    const legacy = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-no-turn', stars: 2, category: 'other', snapshot: '回复',
    }))
    assert.equal(legacy.favorite.turn, undefined)
    assert.equal(testing.favoriteSummary(legacy.favorite).turn, null)
    // upsert 更新星级时保留轮次。
    const again = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-turn', stars: 5, category: 'idea', snapshot: '回复', turn: 7,
    }))
    assert.equal(again.favorite.turn, 7)
    assert.throws(() => testing.applyFavoritesAdd(store.snapshot(), {
      sessionId: 'session-a', messageId: 'msg-bad', stars: 1, turn: 0,
    }), /turn must be an integer from 1 through 100000/)
    const reopened = new StateStore(file)
    await reopened.init()
    assert.equal(reopened.snapshot().favorites.find(item => item.messageId === 'msg-turn').turn, 7)
  })
})

test('parse prompt includes the execution process only for process-focused categories', async () => {
  const process = '思考：先比对两个方案。\n工具：web_search → read_file'
  const processFavorite = { question: '怎么选？', snapshot: '推荐方案 B', stars: 4, reasons: ['process'], process, note: '' }
  const withProcess = testing.buildParsePrompt(processFavorite)
  assert.match(withProcess.user, /执行过程（思考与工具调用顺序）/)
  assert.match(withProcess.user, /web_search → read_file/)
  // 提示词按收藏原因声明解析范围（过程类要求整轮全过程）。
  assert.match(withProcess.system, /SCOPE — process-focused favorite/)
  assert.match(withProcess.system, /不得出现与原文连续 20 字以上的相同片段/)
  const resultScope = testing.buildParsePrompt({ ...processFavorite, reasons: ['output'] })
  assert.match(resultScope.system, /SCOPE — result-focused favorite/)
  assert.doesNotMatch(resultScope.system, /SCOPE — process-focused favorite/)
  const resultFavorite = { ...processFavorite, reasons: ['output'] }
  const withoutProcess = testing.buildParsePrompt(resultFavorite)
  assert.doesNotMatch(withoutProcess.user, /执行过程/)
  assert.doesNotMatch(withoutProcess.user, /web_search/)
  const expressionFavorite = { ...processFavorite, reasons: ['expression'] }
  assert.doesNotMatch(testing.buildParsePrompt(expressionFavorite).user, /执行过程/)
  // 无过程内容时即使分类相关也不注入空段
  const noProcess = testing.buildParsePrompt({ ...processFavorite, process: '' })
  assert.doesNotMatch(noProcess.user, /执行过程（思考与工具调用顺序）/)
})

test('deleting analyzed knowledge keeps the favorite but resets it to skipped, not auto-requeued', async () => {
  await withStore(async (store, file) => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-d', messageId: 'msg-d', stars: 4, category: 'method', snapshot: '回复', question: '提问',
    }))
    const favoriteId = added.favorite.id
    await store.update(state => {
      const record = testing.applyKnowledgeCreate(state, {
        kind: 'pattern', title: '标题', content: '内容', basis: 'observed', confidence: 0.85,
        retention: 'long_term', source: `favorite:${favoriteId}`, tags: ['method', 'favorite', '标签'],
      }).knowledge
      const favorite = state.favorites.find(item => item.id === favoriteId)
      favorite.status = 'analyzed'
      favorite.analyzedAt = '2026-10-19T10:00:00.000Z'
      favorite.knowledgeIds = [record.id]
      return { ok: true }
    })
    const recordId = store.snapshot().knowledge[0].id
    // 删除知识：应成功，并解除收藏引用（不是抛引用错误）。
    const deleted = await store.update(state => testing.applyKnowledgeDelete(state, recordId))
    assert.equal(deleted.deleted, true)
    assert.deepEqual(deleted.unlinkedFavorites, [favoriteId])
    // 收藏内容保留，但知识已不存在，状态必须回到“未解析”才能如实反映。
    const favorite = store.snapshot().favorites.find(item => item.id === favoriteId)
    assert.equal(favorite.knowledgeIds, undefined)
    // skipped 而非 pending：用户删除解析产物的意图不能被下一次启动的自动解析推翻。
    assert.equal(favorite.status, 'skipped')
    assert.equal(favorite.analyzedAt, undefined)
    assert.equal(favorite.stars, 4)
    assert.deepEqual(favorite.reasons, ["process"])
    // skipped 不进启动自动解析队列（等价于 pendingAtStart 过滤只认 pending）。
    assert.equal(favorite.status === 'pending', false)
    // 状态能重新通过校验并持久化（这是此前回滚的根本原因）。
    const reopened = new StateStore(file)
    await reopened.init()
    assert.equal(reopened.snapshot().knowledge.length, 0)
    assert.equal(reopened.snapshot().favorites.length, 1)
    assert.equal(reopened.snapshot().favorites[0].status, 'skipped')
    // 手动重新解析仍可发起：markAnalyzing 对 skipped 可重置。
    const requeued = await testing.markAnalyzing(store, [favoriteId])
    assert.deepEqual(requeued.marked, [favoriteId])
    // 其他知识显式 relatedIds 引用时仍拒绝，避免破坏知识关系。
    await store.update(state => {
      const a = testing.applyKnowledgeCreate(state, { kind: 'rule', title: 'A', content: 'a', basis: 'stated', source: 'test' }).knowledge
      const b = testing.applyKnowledgeCreate(state, { kind: 'rule', title: 'B', content: 'b', basis: 'stated', source: 'test', related_ids: [a.id] }).knowledge
      assert.ok(b)
      return { ok: true }
    })
    const firstId = store.snapshot().knowledge.find(row => row.title === 'A').id
    assert.throws(() => testing.applyKnowledgeDelete(store.snapshot(), firstId), /still referenced by/)
  })
})

test('legacy deterministic analysis is detected and requeued as pending', async () => {
  await withStore(async store => {
    // 造一条旧版解析产物：title=提问原文、content=回复原文、tags 只有 [分类,'favorite']、无 analyzedAt。
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-old', messageId: 'msg-old', stars: 2, category: 'other',
      question: '好的，现在有如下任务：①收藏夹…', snapshot: '三个任务全部落地，67 项测试通过。',
    }))
    const favoriteId = added.favorite.id
    await store.update(state => {
      const record = testing.applyKnowledgeCreate(state, {
        kind: 'observation', title: '好的，现在有如下任务：①收藏夹…', content: '三个任务全部落地，67 项测试通过。',
        basis: 'observed', confidence: 0.55, retention: 'until_stale', source: `favorite:${favoriteId}`,
        tags: ['other', 'favorite'],
      }).knowledge
      const favorite = state.favorites.find(item => item.id === favoriteId)
      favorite.status = 'analyzed'
      favorite.knowledgeIds = [record.id]
      return { ok: true }
    })
    const before = store.snapshot().favorites.find(item => item.id === favoriteId)
    assert.equal(testing.isLegacyAnalyzedFavorite(store.snapshot(), before), true)
    const requeued = await testing.requeueLegacyAnalysis(store)
    assert.deepEqual(requeued.requeued, [favoriteId])
    const after = store.snapshot().favorites.find(item => item.id === favoriteId)
    assert.equal(after.status, 'pending')
    assert.equal(after.knowledgeIds, undefined)
    // 模型解析产物（带模型标签 + analyzedAt）不会被误判。
    const good = { status: 'analyzed', analyzedAt: '2026-10-19T10:00:00.000Z', category: 'method', knowledgeIds: ['know-x'] }
    await store.update(state => {
      state.knowledge.push({
        id: 'know-x', kind: 'pattern', title: 't', content: 'c', basis: 'observed', confidence: 0.7,
        sensitivity: 'normal', status: 'active', retention: 'until_stale', source: 'favorite:x',
        tags: ['method', 'favorite', '迁移'], createdAt: '2026-10-19T10:00:00.000Z', updatedAt: '2026-10-19T10:00:00.000Z',
      })
      return { ok: true }
    })
    assert.equal(testing.isLegacyAnalyzedFavorite(store.snapshot(), good), false)
  })
})

test('analyzed favorites without model tags are not misread as legacy analysis', async () => {
  await withStore(async store => {
    // 模型未输出 tags 的合法解析产物：知识 tags 只有 [分类,'favorite']，但 analyzedAt 与链接俱全。
    // 此前会被 tags 启发式误判为旧版产物，导致每次启动重复解析、知识无限堆积。
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 3, category: 'method',
      question: '如何做？', snapshot: '这样做。',
    }))
    const favoriteId = added.favorite.id
    await store.update(state => {
      const record = testing.applyKnowledgeCreate(state, {
        kind: 'pattern', title: '做法摘要', content: '提炼后的做法内容，不是原文转录。',
        basis: 'observed', confidence: 0.7, retention: 'until_stale', source: `favorite:${favoriteId}`,
        tags: ['method', 'favorite'],
      }).knowledge
      const favorite = state.favorites.find(item => item.id === favoriteId)
      favorite.status = 'analyzed'
      favorite.analyzedAt = '2026-10-20T10:00:00.000Z'
      favorite.knowledgeIds = [record.id]
      return { ok: true }
    })
    const favorite = store.snapshot().favorites.find(item => item.id === favoriteId)
    assert.equal(testing.isLegacyAnalyzedFavorite(store.snapshot(), favorite), false)
    const requeued = await testing.requeueLegacyAnalysis(store)
    assert.deepEqual(requeued.requeued, [])
    assert.equal(store.snapshot().favorites.find(item => item.id === favoriteId).status, 'analyzed')
    assert.equal(store.snapshot().knowledge.length, 1)
  })
})

test('stale analyzing favorites are requeued as pending at startup', async () => {
  await withStore(async store => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 3, question: '怎么做？', snapshot: '这样做。',
    }))
    await testing.markAnalyzing(store, [added.favorite.id])
    // 模拟解析中途进程退出后的重启现场：analyzing 状态无人接管，必须回退为 pending。
    const requeued = await testing.requeueStaleAnalyzing(store)
    assert.deepEqual(requeued.requeued, [added.favorite.id])
    assert.equal(store.snapshot().favorites[0].status, 'pending')
    // 非 analyzing 状态不受影响；再次执行是幂等的。
    assert.deepEqual((await testing.requeueStaleAnalyzing(store)).requeued, [])
  })
})

test('startAnalysis fails analyzing favorites instead of throwing when the parse route is misconfigured', async () => {
  await withStore(async store => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 3, question: '怎么做？', snapshot: '这样做。',
    }))
    await testing.markAnalyzing(store, [added.favorite.id])
    testing.resetParseRouteCache()
    // parseProvider 只配其一 → resolveParseRoute 抛错；必须落为 failed 而不是让 rejection 逃逸。
    const outcome = await testing.startAnalysis(fakeLlm(GOOD_OUTPUT), store, testing.resolvedConfig({ parseProvider: 'deepseek' }))
    assert.equal(outcome.started, false)
    const favorite = store.snapshot().favorites[0]
    assert.equal(favorite.status, 'failed')
    assert.match(favorite.analyzeError, /parseProvider and parseModel/)
    testing.resetParseRouteCache()
  })
})

test('process-only favorites count as parseable input for process categories', async () => {
  await withStore(async store => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 3, category: 'method', process: '先查配置，再重启服务。',
    }))
    assert.equal(testing.hasParseInput(store.snapshot().favorites[0]), true)
    // 结果分类（不在 PROCESS_CATEGORIES）的 process 不注入提示词，也不算可解析内容。
    const other = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-2', stars: 3, category: 'reference', process: '一些过程。',
    }))
    assert.equal(testing.hasParseInput(store.snapshot().favorites.find(item => item.id === other.favorite.id)), false)
  })
})

test('content that is a raw transcript is rejected instead of stored', async () => {
  // 长回复原文被整段照抄 → 判定为转录。
  const reply = '这是一段很长的助手回复，详细说明了收藏夹的设计与实现步骤，包括提问展示、解析管线、星级优先级等多个方面，内容足够长以便触发重合度判定逻辑。'
  assert.equal(testing.looksLikeTranscript(reply, reply), true)
  assert.equal(testing.looksLikeTranscript(`摘要：${reply}`, reply), true)
  // 真正的提炼（明显短于原文且措辞不同）不算转录。
  assert.equal(testing.looksLikeTranscript('收藏夹支持提问与回复双展示，解析走 LLM 提炼管线。', reply), false)
  // 原文过短时不误判。
  assert.equal(testing.looksLikeTranscript('好的', '好的'), false)
})

test('LLM analysis parses one favorite into knowledge with star priority and confidence', async () => {
  await withStore(async (store) => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a',
      messageId: 'msg-1',
      stars: 4,
      category: 'method',
      note: '按依赖顺序执行',
      snapshot: '分三步完成迁移：先备份，再改表，最后校验',
      question: '如何安全完成数据库迁移？',
    }))
    await testing.markAnalyzing(store, [added.favorite.id])
    const result = await testing.runAnalysisQueue(fakeLlm(GOOD_OUTPUT), store, ROUTE)
    assert.equal(result.processed, 1)
    const state = store.snapshot()
    assert.equal(state.knowledge.length, 1)
    const knowledge = state.knowledge[0]
    assert.equal(knowledge.kind, 'pattern')
    assert.equal(knowledge.basis, 'observed')
    assert.equal(knowledge.confidence, 0.85)
    assert.equal(knowledge.priority, 4)
    assert.equal(knowledge.retention, 'long_term')
    assert.match(knowledge.source, /^favorite:/)
    assert.deepEqual(knowledge.tags.sort(), ['对话收藏', '过程决策', '攻略', '备份', '迁移'].sort())
    assert.match(knowledge.content, /分三步完成迁移/)
    assert.match(knowledge.evidence, /具体的执行步骤/)
    assert.equal(state.favorites[0].status, 'analyzed')
    assert.equal(state.favorites[0].knowledgeIds[0], knowledge.id)
    assert.ok(state.favorites[0].analyzedAt)
  })
})

test('LLM analysis marks a favorite failed on bad model output and keeps the error', async () => {
  await withStore(async (store) => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 2, snapshot: '一些回复内容',
    }))
    await testing.markAnalyzing(store, [added.favorite.id])
    await testing.runAnalysisQueue(fakeLlm('这不是 JSON，是散文。'), store, ROUTE)
    const state = store.snapshot()
    assert.equal(state.favorites[0].status, 'failed')
    assert.match(state.favorites[0].analyzeError, /JSON/)
    assert.equal(state.knowledge.length, 0)
  })
})

test('an analyzed favorite can be re-parsed through the panel action', async () => {
  await withStore(async store => {
    // 先解析一次，得到 analyzed + knowledgeIds。
    const first = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-r', messageId: 'msg-r', stars: 3, category: 'method', question: '怎么做？', snapshot: '这样做。',
    }))
    const favoriteId = first.favorite.id
    const llm = fakeLlm(GOOD_OUTPUT)
    await testing.markAnalyzing(store, [favoriteId])
    await testing.runAnalysisQueue(llm, store, ROUTE)
    const analyzed = store.snapshot().favorites.find(item => item.id === favoriteId)
    assert.equal(analyzed.status, 'analyzed')
    const oldKnowledgeId = analyzed.knowledgeIds[0]

    // 关键回归：已解析的收藏再次发起解析，必须真的被标记为 analyzing（此前被过滤掉导致静默无反应）。
    const marked = await testing.markAnalyzing(store, [favoriteId])
    assert.deepEqual(marked.marked, [favoriteId])
    assert.equal(store.snapshot().favorites.find(item => item.id === favoriteId).status, 'analyzing')
    // 重新解析要清掉旧的溯源链接与时间。
    assert.equal(store.snapshot().favorites.find(item => item.id === favoriteId).knowledgeIds, undefined)
    await testing.runAnalysisQueue(llm, store, ROUTE)
    const reparsed = store.snapshot().favorites.find(item => item.id === favoriteId)
    assert.equal(reparsed.status, 'analyzed')
    assert.notEqual(reparsed.knowledgeIds[0], oldKnowledgeId)
  })
})

test('LLM analysis queue parses analyzing favorites in star-descending order and is idempotent', async () => {
  await withStore(async (store) => {
    for (const [messageId, stars] of [['msg-low', 2], ['msg-high', 5], ['msg-mid', 3]]) {
      await store.update(state => testing.applyFavoritesAdd(state, { sessionId: 'session-a', messageId, stars, snapshot: `回复内容 ${messageId}` }))
    }
    await store.update(state => {
      const low = state.favorites.find(item => item.messageId === 'msg-low')
      low.status = 'failed'
      return { favorites: state.favorites }
    })
    const all = store.snapshot().favorites.map(item => item.id)
    await testing.markAnalyzing(store, all)
    const result = await testing.runAnalysisQueue(fakeLlm(GOOD_OUTPUT), store, ROUTE)
    assert.equal(result.processed, 3)
    // 队列按星级降序处理：5 -> 3 -> 2，知识记录按处理顺序创建
    const state = store.snapshot()
    assert.deepEqual(state.knowledge.map(record => record.priority), [5, 3, 2])
    for (const favorite of state.favorites) assert.equal(favorite.status, 'analyzed')
    // 重跑队列无可解析项，不重复建知识
    const again = await testing.runAnalysisQueue(fakeLlm(GOOD_OUTPUT), store, ROUTE)
    assert.equal(again.processed, 0)
    assert.equal(store.snapshot().knowledge.length, 3)
  })
})

test('LLM analysis marks favorites without analyzable content as failed', async () => {
  await withStore(async (store) => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a',
      messageId: 'msg-empty',
      stars: 1,
      category: 'other',
    }))
    await testing.markAnalyzing(store, [added.favorite.id])
    await testing.runAnalysisQueue(fakeLlm(GOOD_OUTPUT), store, ROUTE)
    const state = store.snapshot()
    assert.equal(state.favorites[0].status, 'failed')
    assert.match(state.favorites[0].analyzeError, /收藏内容为空/)
    assert.equal(state.knowledge.length, 0)
  })
})

test('favorite upsert after analysis resets the favorite to pending and re-parsing links a new record', async () => {
  await withStore(async (store) => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 3, snapshot: '初始回复',
    }))
    await testing.markAnalyzing(store, [added.favorite.id])
    await testing.runAnalysisQueue(fakeLlm(GOOD_OUTPUT), store, ROUTE)
    assert.equal(store.snapshot().favorites[0].status, 'analyzed')
    assert.equal(store.snapshot().knowledge.length, 1)
    const updated = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 3, snapshot: '更新后的回复',
    }))
    assert.equal(updated.added, false)
    assert.equal(updated.favorite.status, 'pending')
    assert.equal(updated.favorite.analyzedAt, undefined)
    assert.equal(updated.favorite.knowledgeIds, undefined)
    // 重新解析替换同一收藏之前的知识产物，不重复累积。
    await testing.markAnalyzing(store, [added.favorite.id])
    await testing.runAnalysisQueue(fakeLlm(GOOD_OUTPUT), store, ROUTE)
    assert.equal(store.snapshot().knowledge.length, 1)
    assert.equal(store.snapshot().favorites[0].knowledgeIds.length, 1)
  })
})

test('resolveParseRoute honors explicit config and falls back to the first provider model', async () => {
  testing.resetParseRouteCache()
  try {
    const explicit = await testing.resolveParseRoute(fakeLlm(GOOD_OUTPUT, { provider: 'deepseek', model: 'deepseek-chat' }), testing.resolvedConfig({ parseProvider: 'deepseek', parseModel: 'deepseek-chat' }))
    assert.deepEqual(explicit, { provider: 'deepseek', model: 'deepseek-chat' })
    testing.resetParseRouteCache()
    const auto = await testing.resolveParseRoute(fakeLlm(GOOD_OUTPUT), testing.resolvedConfig({}))
    assert.deepEqual(auto, ROUTE)
    testing.resetParseRouteCache()
    const none = await testing.resolveParseRoute(null, testing.resolvedConfig({}))
    assert.equal(none, null)
  } finally {
    testing.resetParseRouteCache()
  }
})

test('parse route caches do not override new configuration or a replacement model service', async () => {
  testing.resetParseRouteCache()
  try {
    const first = fakeLlm(GOOD_OUTPUT, { provider: 'first', model: 'first-model' })
    const second = fakeLlm(GOOD_OUTPUT, { provider: 'second', model: 'second-model' })
    assert.deepEqual(await testing.resolveParseRoute(first, {}), { provider: 'first', model: 'first-model' })
    assert.deepEqual(await testing.resolveParseRoute(second, {}), { provider: 'second', model: 'second-model' })
    assert.deepEqual(await testing.resolveParseRoute(second, { parseProvider: 'explicit', parseModel: 'explicit-model' }), { provider: 'explicit', model: 'explicit-model' })
    await assert.rejects(testing.resolveParseRoute(second, { parseProvider: 'incomplete' }), /must both be configured/)
  } finally {
    testing.resetParseRouteCache()
  }
})

test('knowledge priority is validated as an integer from 1 through 5', async () => {
  await withStore(async (store) => {
    const base = {
      kind: 'pattern', title: '规则', content: '内容', basis: 'observed', sensitivity: 'normal', status: 'active', retention: 'long_term', source: 'test',
    }
    const record = { ...base, priority: 3 }
    const createdAt = '2026-10-13T00:00:00.000Z'
    const created = await store.update(state => testing.applyKnowledgeCreate(state, { ...base, priority: 3 }))
    assert.equal(created.knowledge.priority, 3)
    const state = store.snapshot()
    assert.throws(() => testing.applyKnowledgeCreate(state, { ...base, priority: 6 }), /priority must be an integer from 1 through 5/)
    assert.throws(() => testing.applyKnowledgeCreate(state, { ...base, priority: 0 }), /priority must be an integer from 1 through 5/)
    assert.throws(() => testing.applyKnowledgeCreate(state, { ...base, priority: 3.5 }), /priority must be an integer from 1 through 5/)
  })
})

test('startAnalysis with llm absent fails marked favorites even when the route cache is populated', async () => {
  testing.resetParseRouteCache()
  try {
    // 先用可用 llm 填充模块级路由缓存（模拟本进程内成功解析过一次）。
    const route = await testing.resolveParseRoute(fakeLlm(GOOD_OUTPUT), testing.resolvedConfig({}))
    assert.deepEqual(route, ROUTE)
    await withStore(async store => {
      const added = await store.update(state => testing.applyFavoritesAdd(state, {
        sessionId: 'session-a', messageId: 'msg-1', stars: 3, snapshot: '回复内容',
      }))
      await testing.markAnalyzing(store, [added.favorite.id])
      // fiber reload 后 llm 服务缺席：缓存命中也不能静默返回 started:true processed:0，
      // 收藏必须落 failed 而不是无声卡在 analyzing。
      const outcome = await testing.startAnalysis(null, store, testing.resolvedConfig({}))
      assert.equal(outcome.started, false)
      assert.equal(outcome.reason, 'no LLM provider available')
      const favorite = store.snapshot().favorites[0]
      assert.equal(favorite.status, 'failed')
      assert.match(favorite.analyzeError, /未配置可用的 LLM 提供方/)
    })
  } finally {
    testing.resetParseRouteCache()
  }
})

test('an unchanged upsert keeps the analyzed status while a content change resets it', async () => {
  await withStore(async store => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 3, snapshot: '初始回复',
    }))
    await testing.markAnalyzing(store, [added.favorite.id])
    await testing.runAnalysisQueue(fakeLlm(GOOD_OUTPUT), store, ROUTE)
    assert.equal(store.snapshot().favorites[0].status, 'analyzed')
    const knowledgeId = store.snapshot().favorites[0].knowledgeIds[0]
    // 同值重存：不重置——否则每次重启自动重解析都生成新知识，旧知识成无引用孤儿。
    const same = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 3, snapshot: '初始回复',
    }))
    assert.equal(same.added, false)
    assert.equal(same.favorite.status, 'analyzed')
    assert.deepEqual(same.favorite.knowledgeIds, [knowledgeId])
    // 内容变化：重置为 pending 并清掉旧失败原因（先人为制造一个 analyzeError）。
    await testing.failAnalysis(store, added.favorite.id, '旧失败')
    const changed = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 4, snapshot: '初始回复',
    }))
    assert.equal(changed.favorite.status, 'pending')
    assert.equal(changed.favorite.analyzeError, undefined)
    assert.equal(changed.favorite.knowledgeIds, undefined)
  })
})

test('failAnalysis falls back to a fixed message for blank errors', async () => {
  await withStore(async store => {
    const added = await store.update(state => testing.applyFavoritesAdd(state, {
      sessionId: 'session-a', messageId: 'msg-1', stars: 3, snapshot: '回复',
    }))
    // 空白 message（如 LLM 适配器抛了空 message 的 Error）不能让失败落库本身失败。
    const failed = await testing.failAnalysis(store, added.favorite.id, '   ')
    assert.equal(failed.failed, true)
    const favorite = store.snapshot().favorites[0]
    assert.equal(favorite.status, 'failed')
    assert.equal(favorite.analyzeError, 'analysis failed')
  })
})
