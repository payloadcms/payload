import type { MCPPluginConfig } from '@payloadcms/plugin-mcp'
import type { Config } from 'payload'

import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'

import { AUDIT_LOG_PATH_ENV, auditPlugin } from '../../../__helpers/plugins/audit/index.js'

type MCPEvalConfig = {
  mcp: MCPPluginConfig
  plugins?: Config['plugins']
} & Omit<Config, 'db' | 'plugins' | 'secret'>

export function buildMCPEvalConfig({
  mcp,
  plugins = [],
  ...config
}: MCPEvalConfig): ReturnType<typeof buildConfig> {
  const databaseURL = getMCPEvalDatabaseURL()

  return buildConfig({
    ...config,
    db: sqliteAdapter({
      busyTimeout: 5000,
      client: { url: databaseURL },
      wal: true,
    }),
    plugins: [
      ...plugins,
      mcpPlugin(mcp),
      auditPlugin({
        beforeOperation: ({ slug, entityType, operation, payloadAPI }) => {
          if (payloadAPI !== 'MCP') {
            throw new Error(
              `MCP eval blocked ${payloadAPI} ${operation} operation on ${entityType} "${slug}"`,
            )
          }
        },
        path: process.env[AUDIT_LOG_PATH_ENV],
      }),
    ],
    secret: 'payload-eval-mcp',
  })
}

export function getMCPEvalDatabaseDirectory(): string {
  return path.dirname(fileURLToPath(getMCPEvalDatabaseURL()))
}

function getMCPEvalDatabaseURL(): string {
  const databaseURL = process.env.PAYLOAD_MCP_EVAL_DATABASE_URL

  if (!databaseURL) {
    throw new Error('PAYLOAD_MCP_EVAL_DATABASE_URL is required for MCP evals')
  }

  return databaseURL
}
