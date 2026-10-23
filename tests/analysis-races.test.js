import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { apply, StateStore, testing } from '../plugin.js'

const route = { provider: 'test-provider', model: 'test-model' }
const payload = { platform: 'bilibili', folder: 'Research', sourceUrl: 'https://space.bilibili.com/1/favlist?fid=2', items: [{ title: 'Original input' }] }
function output(title) {
  return { kind: 'pattern', genre: '攻略', domain: '研究/实验', title, content: 'Research planning connects the goal, evidence, and evaluation criteria.', tags: [] }
}
async function withStore(run) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-analysis-races-'))
  try {
    const store = new StateStore(join(root, 'state.json'))
    await store.init()
    await run(store)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}
function blockedModel(kind, failFirst = false) {
  let release, entered
  const gate = new Promise(resolve => { release = resolve })
  const started = new Promise(resolve => { entered = resolve })
  let calls = 0
  const llm = { async *stream() {
    const first = ++calls === 1
    if (first) {
      entered()
      await gate
      if (failFirst) throw new Error('Original request failed')
    }
    const record = output(first ? 'Original result' : 'Updated result')
    yield { type: 'text-delta', text: JSON.stringify({ records: [record], preferences: [] }) }
    yield { type: 'finish', reason: { kind: 'stop' } }
  } }
  return { llm, started, release, calls: () => calls }
}

for (const kind of ['collection', 'favorite']) {
  for (const failFirst of [false, true]) {
    for (const requeue of [false, true]) {
      test(`${kind}: an old ${failFirst ? 'failure' : 'result'} cannot replace edited content${requeue ? ' queued again' : ''}`, async () => {
        await withStore(async store => {
          const initial = kind === 'collection'
            ? await store.update(state => testing.applyCollectionsImport(state, payload))
            : await store.update(state => testing.applyFavoritesAdd(state, { sessionId: 's', messageId: 'm', stars: 3, snapshot: 'Original input' }))
          const id = (initial.folder ?? initial.favorite).id
          await testing.markAnalyzing(store, [id])
          const model = blockedModel(kind, failFirst)
          const running = testing.runAnalysisQueue(model.llm, store, route)
          await model.started
          try {
            if (kind === 'collection') await store.update(state => testing.applyCollectionsImport(state, { ...payload, items: [{ title: 'Replacement input' }] }))
            else await store.update(state => testing.applyFavoritesAdd(state, { sessionId: 's', messageId: 'm', stars: 5, snapshot: 'Replacement input' }))
            if (requeue) await testing.markAnalyzing(store, [id])
          } finally {
            model.release()
          }
          await running
          const state = store.snapshot()
          const item = (kind === 'collection' ? state.collections : state.favorites)[0]
          assert.equal(item.status, requeue ? 'analyzed' : 'pending')
          assert.equal(model.calls(), requeue ? 2 : 1)
          assert.equal(state.knowledge.length, requeue ? 1 : 0)
          if (requeue) assert.equal(state.knowledge[0].title, 'Updated result')
          assert.equal(item.analyzeError, undefined)
        })
      })
    }
  }
}

test('closed stores reject queued writes and later mutations', async () => {
  await withStore(async store => {
    const queued = store.update(state => { state.tasks = [] })
    const rejected = assert.rejects(queued, /state store is closed/)
    await store.close()
    await rejected
    await assert.rejects(store.update(() => {}), /state store is closed/)
  })
})

test('a reloaded store can parse while the closed store waits for its old model response', async () => {
  await withStore(async oldStore => {
    const { folder } = await oldStore.update(state => testing.applyCollectionsImport(state, payload))
    await testing.markAnalyzing(oldStore, [folder.id])
    const model = blockedModel('collection')
    const running = testing.runAnalysisQueue(model.llm, oldStore, route)
    await model.started
    try {
      await oldStore.close()
      const current = new StateStore(oldStore.file)
      await current.init()
      await current.update(state => testing.applyPreferenceSet(state, { key: 'research.style', value: 'Compare evidence', category: 'work', confidence: 1, source: 'owner' }))
      const llm = { async *stream() {
        yield { type: 'text-delta', text: JSON.stringify({ records: [output('Reloaded result')] }) }
        yield { type: 'finish', reason: { kind: 'stop' } }
      } }
      await testing.runAnalysisQueue(llm, current, route)
      assert.equal(current.snapshot().collections[0].status, 'analyzed')
      assert.equal(current.snapshot().knowledge[0].title, 'Reloaded result')
    } finally {
      model.release()
      await running
    }
    const disk = JSON.parse(await readFile(oldStore.file, 'utf8'))
    assert.equal(disk.preferences[0].key, 'research.style')
    assert.equal(disk.knowledge[0].title, 'Reloaded result')
  })
})

test('plugin disposal prevents its startup analysis from overwriting a new instance', { timeout: 5000 }, async () => {
  await withStore(async store => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, payload))
    await testing.markAnalyzing(store, [folder.id])
    const model = blockedModel('collection')
    let cleanup, finished
    const done = new Promise(resolve => { finished = resolve })
    const ctx = {
      get: name => name === 'llm' ? model.llm : null,
      inject() {}, on: () => () => {},
      effect(install) { cleanup = install() },
      logger: { warn: message => assert.fail(message), info(message) { if (message.includes('auto-analyzed')) finished() } },
    }
    await apply(ctx, { dataFile: store.file, parseProvider: route.provider, parseModel: route.model })
    await model.started
    try {
      await cleanup()
      const current = new StateStore(store.file)
      await current.init()
      await current.update(state => testing.applyPreferenceSet(state, { key: 'saved.after.reload', value: 'Keep this', category: 'other', confidence: 1, source: 'owner' }))
    } finally {
      model.release()
      await done
    }
    const disk = JSON.parse(await readFile(store.file, 'utf8'))
    assert.equal(disk.preferences[0].key, 'saved.after.reload')
    assert.equal(disk.knowledge.length, 0)
  })
})

test('parse versions keep advancing when the saved timestamp is ahead of the clock', async () => {
  await withStore(async store => {
    const { folder } = await store.update(state => testing.applyCollectionsImport(state, payload))
    const future = new Date(Date.now() + 3_600_000).toISOString()
    await store.update(state => { state.collections[0].updatedAt = future })
    await testing.markAnalyzing(store, [folder.id])
    const marked = store.snapshot().collections[0].updatedAt
    assert.ok(marked > future)
    await testing.failAnalysis(store, folder.id, 'retry', marked)
    const failed = store.snapshot().collections[0].updatedAt
    assert.ok(failed > marked)
    await testing.markAnalyzing(store, [folder.id])
    assert.ok(store.snapshot().collections[0].updatedAt > failed)
  })
})
