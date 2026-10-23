import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import { testing } from '../plugin.js'

async function loadClient(snapshot = null, fetchImpl) {
  let exported
  let stateIndex = 0
  const registrations = []
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) }),
    useEffect() {}, useLayoutEffect() {},
    useRef: value => ({ current: value }),
    useState(initial) {
      const value = stateIndex++ === 0 && snapshot ? snapshot : typeof initial === 'function' ? initial() : initial
      return [value, () => {}]
    },
  }
  vm.runInNewContext(await readFile(new URL('../client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load: ({ factory }) => { exported = factory(() => react) } } },
    document: { querySelectorAll: () => [], createElement: () => ({ dataset: {} }), head: { appendChild() {} } },
    console, URL, fetch: fetchImpl,
  })
  const dispose = exported.apply({ slots: {
    inject(_name, callback) { callback(); return () => {} },
    register(entry, component) { registrations.push({ entry, component }); return () => {} },
  } })
  return { internals: exported.captureInternals(), registrations, dispose }
}

function elements(tree) {
  if (!tree || typeof tree !== 'object') return []
  return [tree, ...(tree.children ?? []).flatMap(elements)]
}

test('collection actions return server results even when a newer poll updates the panel', async () => {
  const pending = []
  const client = await loadClient({ config: {}, collections: { collections: [] } }, () => new Promise(resolve => pending.push(resolve)))
  const card = elements(client.registrations[0].component()).find(item => item.type?.name === 'CollectionsCard')
  const imported = { config: {}, linkResult: { folder: 'Research', valid: 2, fetched: 2, dropped: 0 } }
  const action = card.props.onAction({ type: 'collections.parseLink', url: 'https://space.bilibili.com/1/favlist?fid=2' })
  const poll = card.props.onPoll({ type: 'collections.list' })
  pending[1]({ ok: true, json: async () => ({ config: {}, collections: { collectionCount: 1 } }) })
  await poll
  pending[0]({ ok: true, json: async () => imported })
  assert.equal(await action, imported)
  const cleared = { config: {}, removeResult: { removed: 1, removedKnowledge: 3 } }
  const clear = card.props.onAction({ type: 'collections.removeAll' })
  pending[2]({ ok: true, json: async () => cleared })
  assert.equal(await clear, cleared)
  client.dispose()
})

test('client mounts external sources, conversation favorites, and Bilibili collections together', async () => {
  const snapshot = { config: { requestProactivity: false, timeProactivity: true }, favorites: { favorites: [] }, collections: { collections: [] } }
  const client = await loadClient(snapshot)
  const section = client.registrations.find(item => item.entry.name === 'settings.section')
  const tree = section.component()
  const cards = elements(tree).filter(item => typeof item.type === 'function')
  const names = cards.map(item => item.type.name)
  for (const name of ['ProactiveSourcesCard', 'FavoritesCard', 'CollectionsCard', 'WakeListCard']) assert.ok(names.includes(name), name)
  for (const card of cards) assert.doesNotThrow(() => card.type(card.props))
  assert.equal(elements(tree).filter(item => item.props.role === 'switch').length, 3)
  assert.ok(client.registrations.some(item => item.entry.name === 'conversation.chat.assistant-actions'))
  client.dispose()
})

test('an analyzed conversation favorite retains its manual re-parse action', async () => {
  const snapshot = { config: {}, favorites: { favorites: [{ id: 'fav-test', status: 'analyzed', stars: 4, category: 'method', sessionId: 's', messageId: 'm' }] } }
  const client = await loadClient(snapshot)
  const tree = client.registrations[0].component()
  const card = elements(tree).find(item => item.type?.name === 'FavoritesCard')
  const rendered = card.type(card.props)
  assert.ok(elements(rendered).some(item => item.type === 'button' && item.children.includes('重新解析')))
})

test('client and host use the same token budgets for Chinese and English capture', async () => {
  const { internals } = await loadClient()
  assert.deepEqual(JSON.parse(JSON.stringify(internals.FAVORITE_LIMITS)), testing.FAVORITE_LIMITS)
  for (const value of ['研究'.repeat(10000), 'research '.repeat(10000)]) {
    assert.equal(internals.estimateTokens(value), testing.estimateTokens(value))
    const captured = internals.clampTokens(value, testing.FAVORITE_LIMITS.replyTokens)
    assert.ok(captured.length > 0)
    assert.ok(testing.estimateTokens(captured) <= testing.FAVORITE_LIMITS.replyTokens)
  }
})

test('whole-turn capture includes every assistant step and keeps only tool and file names', async () => {
  const { internals } = await loadClient()
  const nodes = new Map([
    ['user', { kind: 'user', data: { content: [{ type: 'text', text: '请规划实验' }] } }],
    ['later', { kind: 'assistant-step', data: { step: 2, blocks: [{ kind: 'reasoning', text: '再验证结果' }, { kind: 'tool-call', name: 'verify', arguments: 'secret' }] } }],
    ['earlier', { kind: 'assistant-step', data: { step: 1, blocks: [{ kind: 'reasoning', text: '先检索资料' }, { kind: 'tool-call', name: 'search', arguments: 'private-path' }] } }],
    ['tail', { kind: 'turn-tail', data: { turn: 'turn-1', closing: { finalNode: { messageId: 'msg-1' }, blocks: [{ kind: 'text', text: '实验方案' }, { kind: 'image', attachment: { name: 'figure.png' } }] } } }],
  ])
  const snapshot = {
    nodes, locations: { getTurn: () => [...nodes.keys()] },
    navigation: { items: () => [{ turn: 'turn-1' }] },
    timeline: { turns: new Map([['turn-1', { data: new Map([['deliverables', { presented: [{ path: 'D:\\private\\report.pdf' }], produced: [] }]]) }]]) },
  }
  const captured = internals.captureTurn(snapshot, 'msg-1')
  assert.equal(captured.question, '请规划实验')
  assert.equal(captured.reply, '实验方案')
  assert.equal(captured.turn, 1)
  assert.match(captured.process, /先检索资料[\s\S]*再验证结果[\s\S]*search → verify/)
  assert.doesNotMatch(JSON.stringify(captured), /secret|private-path|private/)
  assert.deepEqual(Array.from(captured.fileNames), ['report.pdf', 'figure.png'])
})
