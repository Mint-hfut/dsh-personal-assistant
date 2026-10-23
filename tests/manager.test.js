import assert from 'node:assert/strict'
import test from 'node:test'
import { testing } from '../plugin.js'

function succeededWorkflow(scopeCwd = 'D:/work/a', skillName = 'verified-flow') {
  return {
    id: 'flow-1',
    sessionId: 'session-1',
    scopeCwd,
    title: 'Verified flow',
    goal: 'Complete a reusable task.',
    status: 'succeeded',
    trace: [
      { callId: 'call-1', resource: 'web_fetch', outcome: 'success', at: '2026-10-13T00:00:00.000Z' },
      { callId: 'call-2', resource: 'web_fetch', outcome: 'success', at: '2026-10-13T00:00:01.000Z' },
    ],
    traceTruncated: false,
    procedure: [
      { resource: 'web_fetch' },
      { resource: 'web_fetch' },
    ],
    verification: { callId: 'call-2' },
    skillName,
    createdAt: '2026-10-13T00:00:00.000Z',
    updatedAt: '2026-10-13T00:00:01.000Z',
  }
}

function createAgent(id, cwd, catalogs, registrationCounts) {
  const skills = new Map()
  catalogs.set(id, skills)
  return {
    session: { id, header: { cwd } },
    ctx: {
      skills: {
        register(skill) {
          registrationCounts.set(id, (registrationCounts.get(id) || 0) + 1)
          if (!skills.has(skill.name)) skills.set(skill.name, skill)
          const registered = skills.get(skill.name) === skill
          return () => {
            if (registered && skills.get(skill.name) === skill) skills.delete(skill.name)
          }
        },
      },
    },
  }
}

test('workflow manager projects by cwd, reconciles idempotently, and removes deleted skills', async () => {
  const state = { workflows: [succeededWorkflow()] }
  const catalogs = new Map()
  const registrationCounts = new Map()
  const agentA = createAgent('agent-a', 'D:/work/a', catalogs, registrationCounts)
  const agentB = createAgent('agent-b', 'D:/work/b', catalogs, registrationCounts)
  const ctx = {
    skills: {
      async list({ scope }) {
        return [...catalogs.get(scope.session.id).values()]
      },
    },
  }
  const manager = new testing.WorkflowManager(ctx, { snapshot: () => state })
  manager.live.set(agentA, { cleanup: async () => {}, skillContext: agentA.ctx, skillDisposers: new Map() })
  manager.live.set(agentB, { cleanup: async () => {}, skillContext: agentB.ctx, skillDisposers: new Map() })

  assert.deepEqual(await manager.reconcileAll(), { ready: true })
  assert.equal(catalogs.get('agent-a').get('verified-flow').provider, 'personal-assistant')
  assert.equal(catalogs.get('agent-b').has('verified-flow'), false)
  assert.equal(registrationCounts.get('agent-a'), 1)

  assert.deepEqual(await manager.reconcileAll(), { ready: true })
  assert.equal(registrationCounts.get('agent-a'), 1)

  state.workflows = []
  assert.deepEqual(await manager.reconcileAll(), { ready: true })
  assert.equal(catalogs.get('agent-a').has('verified-flow'), false)
})

test('agent detach disposes prompt, trace listener, tools, skills, and flushes state', async () => {
  const state = { workflows: [succeededWorkflow()] }
  const disposed = []
  let flushed = 0
  let effectCleanup
  const catalog = new Map()
  const agent = {
    session: { id: 'agent-a', header: { cwd: 'D:/work/a' } },
    ctx: {
      effect(install) {
        effectCleanup = install()
        return async () => effectCleanup()
      },
      systemPrompt: { section: () => () => disposed.push('prompt') },
      on: () => () => disposed.push('listener'),
      tools: { register: definition => () => disposed.push(`tool:${definition.name}`) },
      skills: {
        register(skill) {
          catalog.set(skill.name, skill)
          return () => {
            catalog.delete(skill.name)
            disposed.push(`skill:${skill.name}`)
          }
        },
      },
    },
  }
  const store = {
    snapshot: () => state,
    async flush() { flushed += 1 },
  }
  const ctx = {
    logger: { warn: message => assert.fail(message) },
    skills: { async list() { return [...catalog.values()] } },
  }
  const manager = new testing.WorkflowManager(ctx, store)
  await manager.attach(agent, { proactive: { cron: '* * * * *', timeZone: 'UTC', title: 'check' } })
  assert.equal(catalog.has('verified-flow'), true)
  await manager.detach(agent)
  assert.equal(manager.live.has(agent), false)
  assert.equal(catalog.size, 0)
  assert.equal(flushed, 1)
  assert.equal(disposed.filter(item => item.startsWith('tool:')).length, 8)
  assert.equal(disposed.includes('prompt'), true)
  assert.equal(disposed.includes('listener'), true)
  assert.equal(disposed.includes('skill:verified-flow'), true)
})

test('concurrent reconciles keep the owned disposer and remove the generated skill', async () => {
  const state = { workflows: [succeededWorkflow()] }
  const catalogs = new Map()
  const registrationCounts = new Map()
  const agent = createAgent('agent-a', 'D:/work/a', catalogs, registrationCounts)
  const manager = new testing.WorkflowManager({
    skills: { async list({ scope }) { return [...catalogs.get(scope.session.id).values()] } },
  }, { snapshot: () => state })
  manager.live.set(agent, { disposing: false, reconcileTail: Promise.resolve(), cleanup: async () => {}, skillContext: agent.ctx, skillDisposers: new Map() })

  await Promise.all([manager.reconcileAll(), manager.reconcileAll()])
  assert.equal(registrationCounts.get('agent-a'), 1)
  state.workflows = []
  await manager.reconcileAll()
  assert.equal(catalogs.get('agent-a').has('verified-flow'), false)
})

test('detach cancels an attach that is waiting for the injected skill scope', async () => {
  let releaseFiber
  const fiber = new Promise(resolve => { releaseFiber = resolve })
  fiber.dispose = async () => { releaseFiber() }
  let registrations = 0
  const agent = {
    session: { id: 'agent-a', header: { cwd: 'D:/work/a' } },
    ctx: {
      inject() { return fiber },
      tools: { register() { registrations += 1; return () => {} } },
    },
  }
  let flushed = 0
  const manager = new testing.WorkflowManager({ logger: { warn: message => assert.fail(message) } }, {
    snapshot: () => ({ workflows: [] }),
    async flush() { flushed += 1 },
  })

  const attaching = manager.attach(agent, { proactive: { cron: '* * * * *', timeZone: 'UTC', title: 'check' } })
  await Promise.resolve()
  await manager.detach(agent)
  await attaching
  assert.equal(registrations, 0)
  assert.equal(manager.live.has(agent), false)
  assert.equal(flushed, 0)
})

test('shutdown attempts every cleanup, retains failed ownership, and aggregates failures', async () => {
  const agentA = { session: { id: 'a' } }
  const agentB = { session: { id: 'b' } }
  let cleanedB = 0
  let flushed = 0
  const manager = new testing.WorkflowManager({}, { async flush() { flushed += 1 } })
  manager.live.set(agentA, { cleanup: async () => { throw new Error('cleanup-a') }, skillDisposers: new Map() })
  manager.live.set(agentB, { cleanup: async () => { cleanedB += 1 }, skillDisposers: new Map() })

  await assert.rejects(manager.shutdown(), error => {
    assert.equal(error instanceof AggregateError, true)
    assert.match(error.message, /shutdown failed/)
    assert.match(String(error.errors[0]), /cleanup-a/)
    return true
  })
  assert.equal(cleanedB, 1)
  assert.equal(flushed, 1)
  assert.equal(manager.live.has(agentA), true)
  assert.equal(manager.live.has(agentB), false)
})

test('workflow manager reports a projection race without removing established skills', async () => {
  const state = { workflows: [succeededWorkflow()] }
  const catalogs = new Map()
  const registrationCounts = new Map()
  const agent = createAgent('agent-a', 'D:/work/a', catalogs, registrationCounts)
  const ctx = {
    skills: {
      async list({ scope }) {
        return [...catalogs.get(scope.session.id).values()]
      },
    },
  }
  const manager = new testing.WorkflowManager(ctx, { snapshot: () => state })
  manager.live.set(agent, { cleanup: async () => {}, skillContext: agent.ctx, skillDisposers: new Map() })
  assert.deepEqual(await manager.reconcileAll(), { ready: true })

  state.workflows.push(succeededWorkflow('D:/work/a', 'late-conflict'))
  catalogs.get('agent-a').set('late-conflict', { name: 'late-conflict', provider: 'external' })
  const projection = await manager.reconcileAll()
  assert.equal(projection.ready, false)
  assert.match(projection.errors[0], /skill name is occupied/)
  assert.equal(catalogs.get('agent-a').get('verified-flow').provider, 'personal-assistant')
})
