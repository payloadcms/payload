import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import * as fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { allocateRecord, defaultPath, main, portAvailable, withLock } from './ledger.mjs'
import { main as configure, settings } from './configure.mjs'
const exec = promisify(execFile)
const script = new URL('./ledger.mjs', import.meta.url).href
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-ledger-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const ledgerPath = path.join(root, 'state.json')
  const put = async (patch) => {
    const file = path.join(root, `${patch.id}.json`)
    await fs.writeFile(file, JSON.stringify(patch))
    await main({ args: ['upsert', file], ledgerPath, output: () => {} })
  }
  const read = async () => JSON.parse(await fs.readFile(ledgerPath, 'utf8'))
  await fs.mkdir(path.join(root, 'test', 'hierarchy'), { recursive: true })
  await fs.writeFile(path.join(root, 'test', 'hierarchy', 'config.ts'), 'export default {}')
  const row = {
    id: 'demo',
    worktree: root,
    suite: 'hierarchy',
    port: 3200,
    database: { adapter: 'mongodb', host: 'localhost', port: 27018, name: 'payload_demo' },
    status: 'reserved',
  }
  return { root, ledgerPath, put, read, row }
}
async function child({ ledgerPath, file }) {
  return exec(process.execPath, [
    '--input-type=module',
    '-e',
    `import { main } from ${JSON.stringify(script)}; await main({args:['upsert',process.argv[2]],ledgerPath:process.argv[1]})`,
    ledgerPath,
    file,
  ])
}

test('updates preserve fields and stopped reservations until cleaned', async (t) => {
  const f = await fixture(t)
  await f.put({ id: 'a', port: 3301, name: 'Example' })
  await f.put({ id: 'a', status: 'stopped' })
  await assert.rejects(f.put({ id: 'b', port: 3301 }), /reserved/)
  assert.equal((await f.read()).environments[0].name, 'Example')
  await f.put({ id: 'a', status: 'cleaned' })
  await f.put({ id: 'b', port: 3301 })
  assert.equal((await f.read()).environments.length, 2)
})
test('database aliases and schemas collide', async (t) => {
  const f = await fixture(t)
  const db = { adapter: 'postgres', host: 'localhost', name: 'test', schema: 'one' }
  await f.put({ id: 'a', database: db })
  await assert.rejects(
    f.put({ id: 'b', database: { ...db, host: '127.0.0.1', port: 5432, schema: 'two' } }),
    /reserved/,
  )
})
test('invalid records leave ledger unchanged', async (t) => {
  const f = await fixture(t)
  await f.put({ id: 'a', port: 3301 })
  const before = await fs.readFile(f.ledgerPath, 'utf8')
  for (const patch of [
    { id: 'b', port: true },
    { id: 'b', password: 'secret' },
    { id: 'b', database: { adapter: 'mongodb', host: 'mongodb://user:secret@host', name: 'test' } },
  ]) {
    await assert.rejects(f.put(patch))
    assert.equal(await fs.readFile(f.ledgerPath, 'utf8'), before)
  }
})
for (const collision of [false, true])
  test(`concurrent processes ${collision ? 'have only one winner for a port' : 'preserve all records'}`, async (t) => {
    const f = await fixture(t)
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, async (_, i) => {
        const file = path.join(f.root, `${i}.json`)
        await fs.writeFile(
          file,
          JSON.stringify({ id: String(i), port: 3400 + (collision ? 0 : i) }),
        )
        return child({ ledgerPath: f.ledgerPath, file })
      }),
    )
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, collision ? 1 : 8)
    assert.equal((await f.read()).environments.length, collision ? 1 : 8)
  })
test('listing missing ledger does not create JSON', async (t) => {
  const f = await fixture(t)
  let output
  await main({
    args: ['list', '--json'],
    ledgerPath: f.ledgerPath,
    output: (v) => {
      output = v
    },
  })
  assert.deepEqual(JSON.parse(output).environments, [])
  await assert.rejects(fs.stat(f.ledgerPath), { code: 'ENOENT' })
})
test('CLI rejects path overrides', async (t) => {
  const f = await fixture(t)
  await assert.rejects(main({ args: ['list', '--ledger', f.ledgerPath], ledgerPath: f.ledgerPath }))
})
test('default path ignores ledger override', () => {
  const old = process.env.PAYLOAD_DEV_LEDGER
  try {
    process.env.PAYLOAD_DEV_LEDGER = '/unused'
    assert.equal(
      defaultPath(),
      path.join(os.homedir(), '.local', 'state', 'payload-dev-isolated', 'environments.json'),
    )
  } finally {
    if (old === undefined) delete process.env.PAYLOAD_DEV_LEDGER
    else process.env.PAYLOAD_DEV_LEDGER = old
  }
})
test('corrupt ledger is preserved', async (t) => {
  const f = await fixture(t)
  await fs.writeFile(f.ledgerPath, '{invalid')
  await assert.rejects(f.put({ id: 'a' }))
  assert.equal(await fs.readFile(f.ledgerPath, 'utf8'), '{invalid')
})
test('lock timeout does not steal another lock', async (t) => {
  const f = await fixture(t)
  await withLock({
    ledgerPath: f.ledgerPath,
    action: async () => {
      await assert.rejects(
        withLock({ ledgerPath: f.ledgerPath, timeoutMs: 30, action: () => assert.fail('entered') }),
        /timeout/,
      )
      assert.ok(await fs.stat(`${f.ledgerPath}.lockdir`))
    },
  })
  await assert.rejects(fs.stat(`${f.ledgerPath}.lockdir`), { code: 'ENOENT' })
})
test('exception releases lock', async (t) => {
  const f = await fixture(t)
  await assert.rejects(
    withLock({
      ledgerPath: f.ledgerPath,
      action: () => {
        throw Error('test')
      },
    }),
  )
  await f.put({ id: 'a' })
})
test('connection requires exact dedicated local database', async (t) => {
  const f = await fixture(t)
  for (const uri of [
    'mongodb://localhost:27018/payload',
    'mongodb://localhost:27017/payload_demo',
    'mongodb://remote:27018/payload_demo',
    'mongodb://localhost:27018/payload_demo?dbName=payload',
  ])
    await assert.rejects(settings({ row: f.row, uri }))
})
test('restart settings disable seed and drop', async (t) => {
  const f = await fixture(t)
  const config = await settings({ row: f.row, uri: 'mongodb://localhost:27018/payload_demo' })
  assert.deepEqual(config.command, ['pnpm', 'run', 'dev', 'hierarchy', '--no-seed'])
  assert.equal(config.env.PAYLOAD_DROP_DATABASE, 'false')
  assert.equal(config.env.DATABASE_URL, config.env.MONGODB_URL)
})
test('rejects cleaned environments and unsafe suites', async (t) => {
  const f = await fixture(t)
  for (const changes of [{ status: 'cleaned' }, { suite: '../other' }, { host: 'remote' }])
    await assert.rejects(
      settings({ row: { ...f.row, ...changes }, uri: 'mongodb://localhost:27018/payload_demo' }),
    )
})
test('real listener is unavailable', async (t) => {
  const server = net.createServer()
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  t.after(() => new Promise((r) => server.close(r)))
  assert.equal(await portAvailable({ port: server.address().port }), false)
})
test('allocator skips reserved and busy ports and rejects exhaustion', async (t) => {
  const f = await fixture(t)
  execFileSync('git', ['init', f.root])
  execFileSync('git', [
    '-C',
    f.root,
    '-c',
    'user.name=Test',
    '-c',
    'user.email=test@example.com',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '--allow-empty',
    '-m',
    'fixture',
  ])
  const options = {
    rows: [{ id: 'other', status: 'stopped', port: 3200 }],
    name: 'Demo name',
    worktree: f.root,
    suite: 'hierarchy',
    startPort: 3200,
    endPort: 3202,
  }
  const row = await allocateRecord({ ...options, probe: async ({ port }) => port !== 3201 })
  assert.equal(row.port, 3202)
  assert.match(row.database.name, /^payload_demo_name_/)
  await assert.rejects(allocateRecord({ ...options, probe: async () => false }), /No available/)
})
test('configure writes private settings without echoing credentials', async (t) => {
  const f = await fixture(t)
  let port = 39000
  while (!(await portAvailable({ port }))) port++
  await f.put({ ...f.row, port })
  const file = path.join(f.root, 'connection')
  await fs.writeFile(file, 'mongodb://user:secret@localhost:27018/payload_demo')
  const output = []
  await configure({
    args: ['demo', '--connection-file', file],
    ledgerPath: f.ledgerPath,
    output: (s) => output.push(s),
  })
  assert.ok(!output.join('').includes('secret'))
  const target = path.join(f.root, 'launch-settings', 'demo.json')
  assert.equal(JSON.parse(await fs.readFile(target, 'utf8')).env.PORT, String(port))
  if (process.platform !== 'win32') assert.equal((await fs.stat(target)).mode & 0o777, 0o600)
})
