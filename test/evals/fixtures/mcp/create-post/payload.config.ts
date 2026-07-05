import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { buildConfig } from 'payload'

const databaseURL = new URL(
  process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0',
)

databaseURL.pathname = '/payload-eval-mcp'

const mcpLogPath = process.env.PAYLOAD_MCP_EVAL_LOG_PATH

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [{ name: 'title', type: 'text', required: true }],
    },
  ],
  db: mongooseAdapter({ url: databaseURL.toString() }),
  plugins: [
    mcpPlugin({
      collections: {
        posts: {},
      },
      hooks: {
        afterToolCall: [
          ({ input, response, toolName }) => {
            if (!mcpLogPath) {
              return response
            }

            const toolCalls = existsSync(mcpLogPath)
              ? (JSON.parse(readFileSync(mcpLogPath, 'utf8')) as unknown[])
              : []
            toolCalls.push({ name: toolName, input, response })
            writeFileSync(mcpLogPath, JSON.stringify(toolCalls), 'utf8')

            return response
          },
        ],
      },
    }),
  ],
  secret: 'payload-eval-mcp',
})
