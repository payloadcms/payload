import { createConnection } from 'node:net'

import type { DatabaseAdapterType } from '../../generateDatabaseAdapter.js'

type DbTarget = {
  host: string
  label: string
  port: number
  profile: 'mongodb' | 'mongodb-atlas' | 'postgres'
}

/**
 * Resolve the docker-hosted endpoint for a given adapter, or null if the
 * adapter runs in-process (sqlite, d1) or is outside our docker-compose
 * (supabase, vercel-postgres-read-replica, content-api).
 */
function getTarget(adapter: DatabaseAdapterType): DbTarget | null {
  const host = process.env.DEVCONTAINER ? 'host.docker.internal' : 'localhost'

  if (adapter === 'mongodb-atlas') {
    return { host, port: 27019, profile: 'mongodb-atlas', label: 'MongoDB Atlas Local' }
  }
  if (['cosmosdb', 'documentdb', 'firestore', 'mongodb'].includes(adapter)) {
    return { host, port: 27018, profile: 'mongodb', label: 'MongoDB' }
  }
  if (
    adapter === 'postgres' ||
    adapter === 'postgres-custom-schema' ||
    adapter === 'postgres-read-replica' ||
    adapter === 'postgres-read-replicas' ||
    adapter === 'postgres-uuid' ||
    adapter === 'postgres-uuidv7'
  ) {
    return { host, port: 5433, profile: 'postgres', label: 'PostgreSQL' }
  }
  return null
}

function tcpPing(host: string, port: number, timeoutMs: number): Promise<string | true> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port })
    const done = (value: string | true) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(value)
    }
    const timer = setTimeout(() => done(`timed out after ${timeoutMs}ms`), timeoutMs)
    socket.once('connect', () => {
      clearTimeout(timer)
      done(true)
    })
    socket.once('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer)
      done(err.code || err.message || String(err))
    })
  })
}

/**
 * Verify the docker-hosted service for the given adapter accepts TCP
 * connections. Prints a friendly error and exits non-zero when unreachable.
 * Does nothing for file-based adapters (sqlite, d1) or externally-managed ones.
 */
export async function assertDbReachable(adapter: DatabaseAdapterType): Promise<void> {
  const target = getTarget(adapter)
  if (!target) {
    return
  }

  const result = await tcpPing(target.host, target.port, 2000)
  if (result === true) {
    return
  }

  const lines = [
    '',
    '\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m',
    `\x1b[31m✗ ${target.label} is not reachable at ${target.host}:${target.port}\x1b[0m`,
    '',
    `  Adapter : \x1b[1m${adapter}\x1b[0m`,
    `  Reason  : ${result}`,
    '',
    `  \x1b[2mStart the service on your host:\x1b[0m`,
    `    \x1b[36mpnpm docker:start ${target.profile}\x1b[0m`,
    '',
    `  \x1b[2mOr pick a different adapter (sqlite needs no docker):\x1b[0m`,
    `    \x1b[36mPAYLOAD_DATABASE=sqlite pnpm dev\x1b[0m`,
    '\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m',
    '',
  ]
  process.stderr.write(lines.join('\n'))
  process.exit(1)
}
