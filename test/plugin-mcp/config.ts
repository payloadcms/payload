import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { type MCPAccessSettings, mcpPlugin } from '@payloadcms/plugin-mcp'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Media } from './collections/Media.js'
import { ModifiedPrompts } from './collections/ModifiedPrompts.js'
import { Posts } from './collections/Posts.js'
import { Products } from './collections/Products.js'
import { ReturnedResources } from './collections/ReturnedResources.js'
import { Rolls } from './collections/Rolls.js'
import { Users } from './collections/Users.js'
import { SiteSettings } from './globals/SiteSettings.js'
import { seed } from './seed/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Posts, Products, Rolls, ModifiedPrompts, ReturnedResources],
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
  globals: [SiteSettings],
  onInit: seed,
  plugins: [
    mcpPlugin({
      /**
       * Override the authentication method.
       * This allows you to use a custom authentication method instead of the default API key authentication.
       * @param req - The request object.
       * @returns The MCP access settings.
       */
      // overrideAuth: (req) => {
      //   const { payload } = req

      //   payload.logger.info('[Override MCP auth]:')

      //   return {
      //     posts: {
      //       find: true,
      //     },
      //     products: {
      //       find: true,
      //       update: true,
      //     },
      //     'payload-mcp-tool': {
      //       diceRoll: true,
      //     },
      //     'payload-mcp-prompt': {
      //       echo: true,
      //     },
      //     'payload-mcp-resource': {
      //       data: true,
      //       dataByID: true,
      //     },
      //   } as MCPAccessSettings
      // },
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
      globals: {
        'site-settings': {
          enabled: {
            find: true,
            update: true,
          },
          description: 'Site-wide configuration settings.',
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
            handler: async (args: Record<string, unknown>, req) => {
              const sides = (args.sides as number) || 6
              const result = Math.floor(Math.random() * sides) + 1
              const payload = req.payload

              payload.logger.info(
                `Dice Roll MCP Tool rolled a ${args.sides} sided die and got a ${result}`,
              )

              await payload.create({
                collection: 'rolls',
                data: {
                  sides,
                  result,
                  user: req.user?.id,
                },
                req,
                overrideAccess: false,
                user: req.user,
                draft: true,
              })

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
            handler: async ({ message }, req) => {
              const { payload } = req

              payload.logger.info(`Echo Prompt was sent: ${message}`)

              const modifiedPrompt = `This prompt was sent: ${message}`

              await payload.create({
                collection: 'modified-prompts',
                data: {
                  original: message as string,
                  modified: modifiedPrompt,
                  user: req.user?.id,
                },
                req,
                overrideAccess: false,
                user: req.user,
                draft: true,
              })

              return {
                messages: [
                  {
                    content: {
                      type: 'text',
                      text: modifiedPrompt,
                    },
                    role: 'user',
                  },
                  {
                    content: {
                      type: 'text',
                      text: `This prompt was sent by userId: ${req.user?.id}`,
                    },
                    role: 'assistant',
                  },
                ],
              }
            },
          },
        ],
        resources: [
          // Resource with a static URI
          {
            name: 'data',
            description: 'Data is a resource that contains special data.',
            handler: async (uri, req) => {
              const payload = req.payload

              payload.logger.info(`Data resource was requested`)

              const text = 'My special data.'
              await payload.create({
                collection: 'returned-resources',
                data: {
                  uri: uri.href,
                  content: text,
                  user: req.user?.id,
                },
                req,
                overrideAccess: false,
                user: req.user,
                draft: true,
              })

              return {
                contents: [
                  {
                    uri: uri.href,
                    text,
                  },
                  {
                    uri: uri.href,
                    text: `This was requested by user: ${req.user?.id}`,
                  },
                ],
              }
            },
            mimeType: 'text/plain',
            title: 'Data',
            uri: 'data://app',
          },
          // Resource with a template
          {
            name: 'dataByID',
            description: 'Data is a resource that contains special data.',
            handler: async (uri, { id }, req) => {
              const payload = req.payload

              payload.logger.info(`Data by ID resource was requested`)

              const text = `My special data for ID: ${id}`
              await payload.create({
                collection: 'returned-resources',
                data: {
                  uri: uri.href,
                  content: text,
                  user: req.user?.id,
                },
                req,
                overrideAccess: false,
                user: req.user,
                draft: true,
              })

              return {
                contents: [
                  {
                    uri: uri.href,
                    text,
                  },
                  {
                    uri: uri.href,
                    text: `This was requested by user: ${req.user?.id}`,
                  },
                ],
              }
            },
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
