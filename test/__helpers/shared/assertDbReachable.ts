import { createConnection } from 'node:net'

import type { DatabaseAdapterType } from '../../dbAdapters.js'

import { dbAdapters } from '../../dbAdapters.js'

/**
 * Resolve the host:port to probe for an adapter, honoring the same URL env
 * vars the adapter would. Returns null for adapters that don't need a probe.
 */
function getTarget(adapter: DatabaseAdapterType) {
  const entry = dbAdapters[adapter]
  // Adapters without `port` are file-based (sqlite, d1) or externally-managed
  // (supabase, vercel-postgres-read-replica, content-api) — skip the probe.
  if (!entry || !('port' in entry)) {
    return null
  }
  const envUrl = process.env[entry.envVar] || process.env.DATABASE_URL

  if (envUrl) {
    try {
      const parsed = new URL(envUrl)
      return {
        host: parsed.hostname || entry.host,
        port: parsed.port ? Number(parsed.port) : entry.port,
        profile: entry.profile,
        label: entry.label,
      }
    } catch {
      // Malformed URL — fall through to the docker-compose default.
    }
  }

  return {
    host: entry.host,
    port: entry.port,
    profile: entry.profile,
    label: entry.label,
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

  const result = await tcpPing(target.host, target.port, process.env.CI === 'true' ? 10000 : 2000)
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
