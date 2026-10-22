import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import * as fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

export const defaultPath = () =>
  path.join(os.homedir(), '.local', 'state', 'payload-dev-isolated', 'environments.json')
const fields = new Set(
  'id name thread_id pending_thread_id host repo worktree branch revision suite port database status pid process_started_at restart_command seed_status verified_at notes created_at updated_at'.split(
    ' ',
  ),
)
const statuses = new Set(['reserved', 'configured', 'running', 'stopped', 'unknown', 'cleaned'])
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const validPort = (value) => Number.isInteger(value) && value >= 1024 && value <= 65535

// Exclusive mkdir works across processes on local filesystems. Never steal an old
// lock: a slow owner may still be writing. A crashed owner requires manual recovery.
export async function withLock({ ledgerPath, action, timeoutMs = 10000 }) {
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true })
  const lock = `${ledgerPath}.lockdir`
  const deadline = Date.now() + timeoutMs
  while (true) {
    try {
      await fs.mkdir(lock, { mode: 0o700 })
      break
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      if (Date.now() >= deadline)
        throw new Error(
          `Ledger lock timeout: ${lock}. Verify no helper is running before removing an abandoned lock.`,
        )
      await delay(25)
    }
  }
  try {
    await fs.writeFile(
      path.join(lock, 'owner.json'),
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }),
      { mode: 0o600 },
    )
    return await action()
  } finally {
    await fs.rm(lock, { recursive: true })
  }
}

export async function atomicWrite({ file, data }) {
  const temp = `${file}.${randomUUID()}.tmp`
  let handle
  try {
    handle = await fs.open(temp, 'wx', 0o600)
    await handle.writeFile(`${JSON.stringify(data, null, 2)}\n`)
    await handle.sync()
    await handle.close()
    handle = undefined
    await fs.rename(temp, file)
  } finally {
    await handle?.close()
    await fs.rm(temp, { force: true })
  }
}

export async function readLedger({ ledgerPath }) {
  let data
  try {
    data = JSON.parse(await fs.readFile(ledgerPath, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return { version: 1, environments: [] }
  }
  if (
    data?.version !== 1 ||
    !Array.isArray(data.environments) ||
    data.environments.some((r) => !object(r) || typeof r.id !== 'string') ||
    new Set(data.environments.map((r) => r.id)).size !== data.environments.length
  )
    throw new Error('Invalid ledger; refusing to overwrite')
  return data
}

function databaseKey(db) {
  if (!db) return null
  if (db.path) {
    const file = path.resolve(db.path)
    return JSON.stringify(['file', process.platform === 'win32' ? file.toLowerCase() : file])
  }
  let host = db.host.toLowerCase()
  if (['localhost', '127.0.0.1', '::1'].includes(host)) host = 'loopback'
  return JSON.stringify([
    db.adapter,
    host,
    db.port ?? { mongodb: 27017, postgres: 5432 }[db.adapter],
    db.name,
  ])
}

export function updateRecord({ data, patch }) {
  if (
    !object(patch) ||
    typeof patch.id !== 'string' ||
    !patch.id ||
    Object.keys(patch).some((k) => !fields.has(k))
  )
    throw new Error('Invalid record fields or ID')
  const old = data.environments.find((r) => r.id === patch.id)
  const row = { host: 'local', status: 'reserved', ...old, ...patch }
  if (!statuses.has(row.status) || typeof row.host !== 'string' || !row.host)
    throw new Error('Invalid status or host')
  if (row.port != null && !validPort(row.port)) throw new Error('Invalid server port')
  const db = row.database
  if (db != null) {
    if (
      !object(db) ||
      Object.keys(db).some(
        (k) => !['adapter', 'host', 'port', 'name', 'schema', 'path'].includes(k),
      ) ||
      typeof db.adapter !== 'string' ||
      !db.adapter
    )
      throw new Error('Invalid database identity')
    if (
      db.path
        ? typeof db.path !== 'string' || !path.isAbsolute(db.path)
        : typeof db.host !== 'string' || !db.host || typeof db.name !== 'string' || !db.name
    )
      throw new Error('Database requires absolute path or host/name')
    if (db.port != null && (!Number.isInteger(db.port) || db.port < 1 || db.port > 65535))
      throw new Error('Invalid database port')
    if (Object.values(db).some((v) => String(v).includes('://') || String(v).includes('@')))
      throw new Error('Store credential-free database identity, never a URI')
  }
  if (row.status !== 'cleaned')
    for (const other of data.environments) {
      if (other.id === row.id || other.status === 'cleaned' || (other.host ?? 'local') !== row.host)
        continue
      if (row.port != null && other.port === row.port)
        throw new Error(`Port already reserved by ${other.id}`)
      if (db && databaseKey(other.database) === databaseKey(db))
        throw new Error(`Database already reserved by ${other.id}`)
    }
  const now = new Date().toISOString()
  row.created_at = old?.created_at ?? now
  row.updated_at = now
  return { version: 1, environments: [...data.environments.filter((r) => r.id !== row.id), row] }
}

export async function portAvailable({ port }) {
  if (!validPort(port)) return false
  // Probe specific loopback addresses too: wildcard binds can coexist with a
  // specific-address listener on some platforms. Each probe closes before the next.
  for (const host of ['0.0.0.0', '127.0.0.1', '::', '::1']) {
    const server = net.createServer()
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen({ host, port, ipv6Only: true }, resolve)
      })
    } catch (error) {
      if (host.includes(':') && ['EAFNOSUPPORT', 'EADDRNOTAVAIL'].includes(error.code)) continue
      return false
    } finally {
      if (server.listening) await new Promise((resolve) => server.close(resolve))
    }
  }
  return true
}

export async function allocateRecord({
  rows,
  name,
  worktree,
  suite,
  startPort = 3100,
  endPort = 3999,
  probe = portAvailable,
}) {
  if (!name || !worktree || !/^[\w-]+$/.test(suite ?? ''))
    throw new Error('Name, worktree and suite directory are required')
  const root = await fs.realpath(worktree)
  if (!(await fs.stat(path.join(root, 'test', suite, 'config.ts'))).isFile())
    throw new Error('Missing suite config')
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
  if ((await fs.realpath(git('rev-parse', '--show-toplevel'))) !== root)
    throw new Error('Use the worktree root')
  if (rows.some((r) => r.status !== 'cleaned' && r.worktree === root))
    throw new Error('Worktree already assigned')
  if (!validPort(startPort) || !validPort(endPort) || startPort > endPort)
    throw new Error('Invalid port range')
  const reserved = new Set(
    rows
      .filter((r) => r.status !== 'cleaned' && (r.host ?? 'local') === 'local')
      .map((r) => r.port),
  )
  let port
  for (let p = startPort; p <= endPort; p++)
    if (!reserved.has(p) && (await probe({ port: p }))) {
      port = p
      break
    }
  if (!port) throw new Error('No available unreserved port in range')
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'dev'
  const id = `${slug}-${randomUUID().replaceAll('-', '').slice(0, 12)}`
  return {
    id,
    name,
    host: 'local',
    worktree: root,
    suite,
    port,
    status: 'reserved',
    revision: git('rev-parse', 'HEAD'),
    database: {
      adapter: 'mongodb',
      host: 'localhost',
      port: 27018,
      name: `payload_${id.replaceAll('-', '_')}`,
    },
  }
}

export async function main({
  args = process.argv.slice(2),
  ledgerPath = defaultPath(),
  output = console.log,
} = {}) {
  const command = args[0]
  const schemas = {
    list: { json: { type: 'boolean' } },
    show: {},
    status: {},
    upsert: {},
    allocate: Object.fromEntries(
      ['name', 'worktree', 'suite', 'start-port', 'end-port'].map((k) => [k, { type: 'string' }]),
    ),
  }
  if (!(command in schemas))
    throw new Error(
      'Usage: ledger.mjs list [--json] | show ID | status ID | upsert FILE | allocate --name NAME --worktree PATH --suite SUITE',
    )
  const { values, positionals } = parseArgs({
    args: args.slice(1),
    options: schemas[command],
    allowPositionals: true,
    strict: true,
  })
  if (positionals.length !== (['show', 'status', 'upsert'].includes(command) ? 1 : 0))
    throw new Error('Invalid command arguments')
  await withLock({
    ledgerPath,
    action: async () => {
      const data = await readLedger({ ledgerPath })
      if (['allocate', 'upsert'].includes(command)) {
        const patch =
          command === 'upsert'
            ? JSON.parse(await fs.readFile(positionals[0], 'utf8'))
            : await allocateRecord({
                rows: data.environments,
                name: values.name,
                worktree: values.worktree,
                suite: values.suite,
                startPort: Number(values['start-port'] ?? 3100),
                endPort: Number(values['end-port'] ?? 3999),
              })
        await atomicWrite({ file: ledgerPath, data: updateRecord({ data, patch }) })
        output(patch.id)
      } else if (command === 'show' || command === 'status') {
        const row = data.environments.find((r) => r.id === positionals[0])
        if (!row) throw new Error('Unknown environment')
        output(
          JSON.stringify(
            command === 'show'
              ? row
              : {
                  ...row,
                  port_observation: row.port
                    ? (await portAvailable({ port: row.port }))
                      ? 'available'
                      : 'occupied or unavailable'
                    : 'unassigned',
                  ownership_verified: false,
                },
            null,
            2,
          ),
        )
      } else if (values.json) output(JSON.stringify(data, null, 2))
      else {
        output('ID\tSTATUS (recorded)\tPORT\tDATABASE\tWORKTREE')
        for (const r of data.environments)
          output(
            [r.id, r.status, r.port, r.database?.path ?? r.database?.name, r.worktree]
              .map((v) => v ?? '')
              .join('\t'),
          )
        if (!data.environments.length) output('(No environments registered)')
      }
    },
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
