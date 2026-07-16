import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const MCP_EVAL_DATABASE_URL_ENV = 'PAYLOAD_MCP_EVAL_DATABASE_URL'

export type MCPEvalDatabase = {
  cleanup: () => void
  url: string
}

export function createMCPEvalDatabase(): MCPEvalDatabase {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'payload-mcp-eval-'))

  return {
    cleanup: () => rmSync(directory, { force: true, recursive: true }),
    url: pathToFileURL(path.join(directory, 'database.sqlite')).href,
  }
}

export function setMCPEvalDatabaseEnvironment({
  databaseURL,
}: {
  databaseURL: string
}): () => void {
  const previousDatabaseURL = process.env[MCP_EVAL_DATABASE_URL_ENV]
  const previousDropDatabase = process.env.PAYLOAD_DROP_DATABASE
  const previousForceDrizzlePush = process.env.PAYLOAD_FORCE_DRIZZLE_PUSH

  process.env[MCP_EVAL_DATABASE_URL_ENV] = databaseURL
  process.env.PAYLOAD_DROP_DATABASE = 'false'
  process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'

  return () => {
    restoreEnv({ name: MCP_EVAL_DATABASE_URL_ENV, value: previousDatabaseURL })
    restoreEnv({ name: 'PAYLOAD_DROP_DATABASE', value: previousDropDatabase })
    restoreEnv({ name: 'PAYLOAD_FORCE_DRIZZLE_PUSH', value: previousForceDrizzlePush })
  }
}

function restoreEnv({ name, value }: { name: string; value: string | undefined }): void {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}
