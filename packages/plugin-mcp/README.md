# Payload MCP Plugin

A Payload plugin that provides MCP (Model Context Protocol) functionality.

```bash
pnpm add @payloadcms/plugin-mcp
```

## 🚀 Basic Setup

```typescript
import { buildConfig } from 'payload'
import { pluginMcp } from '@payloadcms/plugin-mcp'

export default buildConfig({
  // ... your existing config
  plugins: [
    pluginMcp({
      collections: {
        posts: true,
        users: true,
      },
    }),
  ],
})
```

## Tools

These tools allow LLMs to interact with collection documents by treating collection documents as MCP resources.

### Resources

| Tool                                                 | Description                            |
| ---------------------------------------------------- | -------------------------------------- |
| [`findResources`](src/mcp/tools/resource/find.ts)    | Find documents in a collection         |
| [`createResource`](src/mcp/tools/resource/create.ts) | Create a new document                  |
| [`updateResource`](src/mcp/tools/resource/update.ts) | Update documents by ID or where clause |
| [`deleteResource`](src/mcp/tools/resource/delete.ts) | Delete documents by ID or where clause |

## Advanced Setup

```typescript
import { z } from 'zod'
import { pluginMcp } from '@payloadcms/plugin-mcp'

export default buildConfig({
  // ... your existing config
  plugins: [
    pluginMcp({
      collections: {
        posts: true,
      },
      // Set your own MCP server options
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
        // Add your own custom tools
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
    }),
  ],
})
```

## Testing your MCP Server

Use [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test your MCP server:

```bash
npx @modelcontextprotocol/inspector
```

1. Go to `http://localhost:6274/`
2. Set Transport Type to `Streamable HTTP`
3. Set URL to `http://localhost:3000/api/mcp`
4. Press _Connect_
