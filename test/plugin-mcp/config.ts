import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Media } from './collections/Media.js'
import { Posts } from './collections/Posts.js'
import { Products } from './collections/Products.js'
import { Users } from './collections/Users.js'
import { seed } from './seed/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Posts, Products],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: [
      {
        code: 'en',
        label: 'English',
      },
      {
        code: 'es',
        label: 'Spanish',
      },
      {
        code: 'fr',
        label: 'French',
      },
    ],
  },
  onInit: seed,
  plugins: [
    mcpPlugin({
      overrideApiKeyCollection: (collection) => {
        collection.fields.push({
          name: 'override',
          type: 'text',
          admin: {
            description: 'This field added by overrideApiKeyCollection',
          },
          defaultValue: 'This field added by overrideApiKeyCollection',
        })
        return collection
      },
      collections: {
        [Products.slug]: {
          enabled: true,
        },
        posts: {
          enabled: {
            find: true,
            create: true,
            update: true,
            delete: true,
          },
          description: 'This is a Payload collection with Post documents.',
          override: (original: Record<string, unknown>, req) => {
            const updatedOriginal = {
              ...original,
              title: `Title Override: ${original?.title as string}`,
            }
            req.payload.logger.info('[Override MCP call for Posts]:')
            return updatedOriginal
          },
          overrideResponse: (response, doc, req) => {
            req.payload.logger.info('[Override MCP response for Posts]:')
            response.content.push({
              type: 'text',
              text: `Override MCP response for Posts!`,
            })
            return response
          },
        },
        media: {
          enabled: {
            find: true,
            create: false,
            update: true,
            delete: false,
          },
          description: 'This is a Payload collection with Media documents.',
        },
      },
      mcp: {
        handlerOptions: {
          verboseLogs: true,
          maxDuration: 60,
        },
        serverOptions: {
          serverInfo: {
            name: 'My Custom MCP Server',
            version: '1.0.0',
          },
        },
        tools: [
          {
            name: 'diceRoll',
            description: 'Rolls a virtual dice with a specified number of sides',
            handler: (args: Record<string, unknown>) => {
              const sides = (args.sides as number) || 6
              const result = Math.floor(Math.random() * sides) + 1
              return Promise.resolve({
                content: [
                  {
                    type: 'text' as const,
                    text: `# Dice Roll Result\n\n**Sides:** ${sides}\n**Result:** ${result}\n\n🎲 You rolled a **${result}** on a ${sides}-sided die!`,
                  },
                ],
              })
            },
            parameters: z.object({
              sides: z
                .number()
                .int()
                .min(2)
                .max(1000)
                .optional()
                .default(6)
                .describe('Number of sides on the dice (default: 6)'),
            }).shape,
          },
        ],
        prompts: [
          {
            name: 'echo',
            argsSchema: { message: z.string() },
            description: 'Creates a prompt to process a message',
            title: 'Echo Prompt',
            handler: ({ message }: { message: string }) => ({
              messages: [
                {
                  content: {
                    type: 'text',
                    text: `Please process this message: ${message}`,
                  },
                  role: 'user',
                },
              ],
            }),
          },
        ],
        resources: [
          // Resource with a static URI
          {
            name: 'data',
            description: 'Data is a resource that contains special data.',
            handler: (uri) => ({
              contents: [
                {
                  uri: uri.href,
                  text: 'My special data.',
                },
              ],
            }),
            mimeType: 'text/plain',
            title: 'Data',
            uri: 'data://app',
          },
          // Resource with a template
          {
            name: 'dataByID',
            description: 'Data is a resource that contains special data.',
            handler: (uri, { id }) => ({
              contents: [
                {
                  uri: uri.href,
                  text: `My special data for ID: ${id}`,
                },
              ],
            }),
            mimeType: 'text/plain',
            title: 'Data By ID',
            uri: new ResourceTemplate('data://app/{id}', { list: undefined }),
          },
        ],
      },

      // Experimental MCP tools
      experimental: {
        tools: {
          collections: {
            collectionsDirPath: 'test/plugin-mcp/collections',
            enabled: true,
          },
          config: {
            configFilePath: path.resolve(dirname, 'test/plugin-mcp/config.ts'),
            enabled: true,
          },
          jobs: {
            enabled: true,
            jobsDirPath: 'dev/jobs',
          },
          auth: {
            enabled: true,
          },
        },
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
