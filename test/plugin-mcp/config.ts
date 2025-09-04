import { pluginMCP } from '@payloadcms/plugin-mcp'
import path from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { Media } from './collections/Media.js'
import { Posts } from './collections/Posts.js'
import { seed } from './seed/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Media, Posts],
  onInit: seed,
  plugins: [
    pluginMCP({
      collections: {
        media: true,
        posts: true,
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
      },

      // Experimental MCP tools
      _experimental: {
        tools: {
          collections: {
            collectionsDirPath: 'dev/collections',
            enabled: true,
          },
          config: {
            configFilePath: path.resolve(dirname, 'payload.config.ts'),
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
