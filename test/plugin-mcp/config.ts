import { ResourceTemplate } from '@modelcontextprotocol/server'
import { defineCollectionTool, definePrompt, defineTool, mcpPlugin } from '@payloadcms/plugin-mcp'
import path from 'path'
import { definePlugin } from 'payload'
import { fileURLToPath } from 'url'
import * as z from 'zod'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { FieldTypes } from './collections/FieldTypes.js'
import { Media } from './collections/Media.js'
import { ModifiedPrompts } from './collections/ModifiedPrompts.js'
import { Pages } from './collections/Pages.js'
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
  endpoints: [
    {
      handler: () => Response.json({ status: 'ok' }),
      method: 'get',
      path: '/health',
    },
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Posts,
    Products,
    Rolls,
    ModifiedPrompts,
    ReturnedResources,
    Pages,
    FieldTypes,
  ],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
      { code: 'fr', label: 'French' },
    ],
  },
  globals: [SiteSettings],
  onInit: seed,
  plugins: [
    // Plugin listed BEFORE mcp in the array — injects a tool via slug + options
    definePlugin({
      order: 1,
      slug: 'before-mcp',
      plugin: ({ config, plugins }) => {
        const mcp = plugins['@payloadcms/plugin-mcp']
        if (mcp?.options) {
          const opts = mcp.options
          opts.tools ??= {}
          opts.tools.injectedBefore = {
            description: 'Tool injected by a plugin listed before mcp',
            handler: () => ({
              content: [{ type: 'text' as const, text: 'injected-before' }],
            }),
            input: { type: 'object', properties: {} },
          }
        }
        return config
      },
    })(),

    mcpPlugin({
      overrideApiKeyCollection: (collection) => {
        collection.fields.push({
          name: 'override',
          type: 'text',
          admin: { description: 'This field added by overrideApiKeyCollection' },
          defaultValue: 'This field added by overrideApiKeyCollection',
        })
        return collection
      },
      collections: {
        users: {
          description: 'User accounts.',
          // Opt-in auth ops: enabling these exposes login/verify/etc. via MCP.
          tools: {
            auth: true,
            forgotPassword: true,
            login: true,
            resetPassword: true,
            unlock: true,
            verify: true,
          },
        },
        'field-types': {
          description: 'A collection covering all Payload field types for MCP schema testing.',
        },
        pages: {
          description: 'Pages with block-based layouts.',
        },
        posts: {
          description: 'This is a Payload collection with Post documents.',
          overrideResponse: (response, doc, req) => {
            req.payload.logger.info('[Override MCP response for Posts]:')
            response.content.push({
              type: 'text',
              text: `Override MCP response for Posts!`,
            })
            return response
          },
          tools: {
            // Built-in override — keep `findDocuments` enabled, just tighten its
            // client-facing description. (Built-in keys autocomplete here.)
            find: {
              annotations: { title: 'Find Posts' },
              description:
                'Find blog posts. Pass an `id` to fetch one; omit it to list with pagination.',
            },

            // Custom collection-scoped tool — exposed once as `publish`, with
            // collectionSlug deciding which collection it acts on.
            publish: defineCollectionTool({
              annotations: {
                title: 'Publish Post',
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
                readOnlyHint: false,
              },
              description: 'Publish a draft post by ID.',
              input: z.object({
                id: z.string().describe('The post ID to publish.'),
              }),
            }).handler(async ({ collectionSlug, input, authorizedMCP, req }) => {
              const result = await req.payload.update({
                id: input.id,
                collection: collectionSlug,
                data: { _status: 'published' },
                req,
                overrideAccess: authorizedMCP.overrideAccess,
                user: authorizedMCP.user,
              })
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: `Published ${collectionSlug} ${input.id}.\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
                  },
                ],
              }
            }),
          },
        },
        media: {
          description: 'This is a Payload collection with Media documents.',
          // Partial-disable — find/update remain enabled, create/delete blocked.
          tools: {
            create: false,
            delete: false,
          },
        },
      },
      globals: {
        'site-settings': {
          description: 'Site-wide configuration settings.',
          tools: {
            find: {
              annotations: { title: 'Find Site Settings' },
            },
          },
        },
      },
      mcp: {
        serverOptions: {
          serverInfo: {
            name: 'My Custom MCP Server',
            version: '1.0.0',
          },
        },
        verboseLogs: true,
      },
      tools: {
        diceRoll: defineTool({
          annotations: {
            title: 'Dice Roll',
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
            readOnlyHint: false,
          },
          description: 'Rolls a virtual dice with a specified number of sides',
          input: z.object({
            sides: z
              .number()
              .int()
              .min(2)
              .max(1000)
              .optional()
              .default(6)
              .describe('Number of sides on the dice (default: 6)'),
          }),
        }).handler(async ({ input, authorizedMCP, req }) => {
          const sides = input.sides
          const result = Math.floor(Math.random() * sides) + 1

          req.payload.logger.info(
            `Dice Roll MCP Tool rolled a ${sides} sided die and got a ${result}`,
          )

          await req.payload.create({
            collection: 'rolls',
            data: {
              sides,
              result,
              user: req.user?.id,
            },
            req,
            draft: true,
            overrideAccess: authorizedMCP.overrideAccess,
            user: authorizedMCP.user,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `# Dice Roll Result\n\n**Sides:** ${sides}\n**Result:** ${result}\n\n🎲 You rolled a **${result}** on a ${sides}-sided die!`,
              },
            ],
          }
        }),
      },
      prompts: {
        echo: definePrompt({
          argsSchema: z.object({ message: z.string() }),
          description: 'Creates a prompt to process a message',
          title: 'Echo Prompt',
        }).handler(async ({ input: { message }, req }) => {
          const { payload } = req

          payload.logger.info(`Echo Prompt was sent: ${message}`)

          const modifiedPrompt = `This prompt was sent: ${message}`

          await payload.create({
            collection: 'modified-prompts',
            data: {
              original: message,
              modified: modifiedPrompt,
              user: req.user?.id,
            },
            req,
            draft: true,
            overrideAccess: false,
            user: req.user,
          })

          return {
            messages: [
              {
                content: { type: 'text', text: modifiedPrompt },
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
        }),
      },
      resources: {
        data: {
          description: 'Data is a resource that contains special data.',
          handler: async ({ req, uri }) => {
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
              draft: true,
              overrideAccess: false,
              user: req.user,
            })

            return {
              contents: [
                { uri: uri.href, text },
                { uri: uri.href, text: `This was requested by user: ${req.user?.id}` },
              ],
            }
          },
          mimeType: 'text/plain',
          title: 'Data',
          uri: 'data://app',
        },
        dataByID: {
          description: 'Data is a resource that contains special data.',
          handler: async ({ params: { id }, req, uri }) => {
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
              draft: true,
              overrideAccess: false,
              user: req.user,
            })

            return {
              contents: [
                { uri: uri.href, text },
                { uri: uri.href, text: `This was requested by user: ${req.user?.id}` },
              ],
            }
          },
          mimeType: 'text/plain',
          title: 'Data By ID',
          uri: new ResourceTemplate('data://app/{id}', { list: undefined }),
        },
      },
    }),
    // Plugin listed AFTER mcp in the array — also injects a tool via slug + options
    definePlugin({
      order: 1,
      slug: 'after-mcp',
      plugin: ({ config, plugins }) => {
        const mcp = plugins['@payloadcms/plugin-mcp']
        if (mcp?.options) {
          const opts = mcp.options
          opts.tools ??= {}
          opts.tools.injectedAfter = {
            description: 'Tool injected by a plugin listed after mcp',
            handler: () => ({
              content: [{ type: 'text' as const, text: 'injected-after' }],
            }),
            input: { type: 'object', properties: {} },
          }
        }
        return config
      },
    })(),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
