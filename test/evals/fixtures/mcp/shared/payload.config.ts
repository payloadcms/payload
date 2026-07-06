import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
      slug: 'authors',
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      slug: 'posts',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'draft',
          options: ['draft', 'published'],
        },
        { name: 'author', type: 'relationship', relationTo: 'authors' },
        { name: 'content', type: 'richText' },
      ],
    },
  ],
  db: mongooseAdapter({ url: databaseURL.toString() }),
  editor: lexicalEditor({}),
  globals: [
    {
      slug: 'site-settings',
      fields: [{ name: 'tagline', type: 'text', defaultValue: 'Original tagline' }],
    },
  ],
  plugins: [
    mcpPlugin({
      collections: {
        authors: {},
        posts: {},
      },
      globals: {
        'site-settings': {},
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
