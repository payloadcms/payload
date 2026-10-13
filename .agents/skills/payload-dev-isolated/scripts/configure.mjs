import * as fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { atomicWrite, defaultPath, portAvailable, readLedger, withLock } from './ledger.mjs'

export async function settings({ row, uri }) {
  const db = row.database ?? {}
  if (row.status === 'cleaned' || (row.host ?? 'local') !== 'local')
    throw new Error('Environment must be active and local')
  if (db.adapter !== 'mongodb' || !/^payload_[a-z0-9_]+$/.test(db.name ?? ''))
    throw new Error('Only dedicated named MongoDB environments are supported')
  let parsed
  try {
    parsed = new URL(uri)
  } catch {
    throw new Error('Invalid MongoDB connection URI')
  }
  const local = ['localhost', '127.0.0.1', '::1', '[::1]']
  if (
    parsed.protocol !== 'mongodb:' ||
    parsed.hash ||
    !local.includes(parsed.hostname) ||
    !local.includes(db.host)
  )
    throw new Error('Use a single local MongoDB endpoint')
  if (Number(parsed.port || 27017) !== db.port || parsed.pathname !== `/${db.name}`)
    throw new Error('Connection must match the reserved database name and service port')
  if (
    [...parsed.searchParams.keys()].some((k) =>
      ['dbname', 'loadbalanced'].includes(k.toLowerCase()),
    )
  )
    throw new Error('Unsupported connection option')
  if (!Number.isInteger(row.port) || row.port < 1024 || row.port > 65535)
    throw new Error('Invalid reserved server port')
  const root = await fs.realpath(row.worktree)
  if (
    !/^[\w-]+$/.test(row.suite ?? '') ||
    !(await fs.stat(path.join(root, 'test', row.suite, 'config.ts'))).isFile()
  )
    throw new Error('Registered suite missing or invalid')
  return {
    worktree: root,
    command: ['pnpm', 'run', 'dev', row.suite, '--no-seed'],
    env: {
      PORT: String(row.port),
      PAYLOAD_DATABASE: 'mongodb',
      MONGODB_URL: uri,
      DATABASE_URL: uri,
      PAYLOAD_DROP_DATABASE: 'false',
    },
  }
}

export async function main({
  args = process.argv.slice(2),
  ledgerPath = defaultPath(),
  output = console.log,
} = {}) {
  const { values, positionals } = parseArgs({
    args,
    options: { 'connection-file': { type: 'string' } },
    allowPositionals: true,
    strict: true,
  })
  if (positionals.length !== 1 || !/^[\w-]+$/.test(positionals[0]) || !values['connection-file'])
    throw new Error('Usage: configure.mjs ID --connection-file FILE')
  await withLock({
    ledgerPath,
    action: async () => {
      const data = await readLedger({ ledgerPath })
      const row = data.environments.find((r) => r.id === positionals[0])
      if (!row) throw new Error('Unknown environment')
      const config = await settings({
        row,
        uri: (await fs.readFile(values['connection-file'], 'utf8')).trim(),
      })
      if (!(await portAvailable({ port: row.port })))
        throw new Error('Reserved server port is no longer available')
      const folder = path.join(path.dirname(ledgerPath), 'launch-settings')
      await fs.mkdir(folder, { recursive: true, mode: 0o700 })
      const target = path.join(folder, `${row.id}.json`)
      await atomicWrite({ file: target, data: config })
      output(`Private startup settings: ${target}`)
      output(
        'URI and port match the reservation. Runtime adapter overrides have NOT been verified.',
      )
      output(
        'No server started; no data seeded. Inspect the effective suite adapter before startup.',
      )
    },
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
