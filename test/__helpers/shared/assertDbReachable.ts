import { createConnection } from 'node:net'

import type { DatabaseAdapterType } from '../../generateDatabaseAdapter.js'

import { adapterEndpoints } from './dbProfiles.js'

type DbTarget = {
  host: string
  label: string
  port: number
  profile: 'mongodb' | 'mongodb-atlas' | 'postgres'
}

/**
 * Resolve the endpoint to TCP-probe for a given adapter. Reads the same env
 * vars the generated adapter would (e.g. MONGODB_URL, POSTGRES_URL,
 * DATABASE_URL) so a user pointing at their own host-installed Postgres on
 * 5432 gets that probed, not the docker-compose default of 5433.
 *
 * Returns null for adapters that run in-process (sqlite, d1) or are outside
 * our docker-compose (supabase, vercel-postgres-read-replica, content-api).
 */
function getTarget(adapter: DatabaseAdapterType): DbTarget | null {
  const endpoint = adapterEndpoints[adapter]
  if (!endpoint) {
    return null
  }
  const envUrl = process.env[endpoint.envVar] || process.env.DATABASE_URL

  if (envUrl) {
    try {
      const parsed = new URL(envUrl)
      return {
        host: parsed.hostname || endpoint.host,
        port: parsed.port ? Number(parsed.port) : endpoint.port,
        profile: endpoint.profile,
        label: endpoint.label,
      }
    } catch {
      // Malformed URL — fall through to the docker-compose default.
    }
  }

  return {
    host: endpoint.host,
    port: endpoint.port,
    profile: endpoint.profile,
    label: endpoint.label,
  }
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
 * Does nothing for file-based adapters like sqlite.
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
    `  \x1b[2mStart the service:\x1b[0m`,
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
