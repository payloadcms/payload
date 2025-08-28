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

| Tool                                                 | Domain   | Description                            |
| ---------------------------------------------------- | -------- | -------------------------------------- |
| [`findResources`](src/mcp/tools/resource/find.ts)    | Resource | Find documents in a collection         |
| [`createResource`](src/mcp/tools/resource/create.ts) | Resource | Create a new document                  |
| [`updateResource`](src/mcp/tools/resource/update.ts) | Resource | Update documents by ID or where clause |
| [`deleteResource`](src/mcp/tools/resource/delete.ts) | Resource | Delete documents by ID or where clause |

### Auth (Experimental)

These tools allow for LLMs to modify user Auth. This is an experimental feature to test the viability of assistants that help with common admin tasks.

| Tool                                                     | Domain | Description                                                             |
| -------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| [`auth`](src/mcp/tools/auth/auth.ts)                     | Auth   | Check authentication status for the current user                        |
| [`login`](src/mcp/tools/auth/login.ts)                   | Auth   | Authenticate a user with email and password                             |
| [`verify`](src/mcp/tools/auth/verify.ts)                 | Auth   | Verify a user email with a verification token                           |
| [`resetPassword`](src/mcp/tools/auth/resetPassword.ts)   | Auth   | Reset a user password with a reset token                                |
| [`forgotPassword`](src/mcp/tools/auth/forgotPassword.ts) | Auth   | Send a password reset email to a user                                   |
| [`unlock`](src/mcp/tools/auth/unlock.ts)                 | Auth   | Unlock a user account that has been locked due to failed login attempts |

### Collections (Experimental)

These tools are for developing Payload. They allow LLMs to understand and modify your collections.

| Tool                                                     | Domain     | Description                                                  |
| -------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| [`findCollections`](src/mcp/tools/collection/find.ts)    | Collection | Find and list Payload collections                            |
| [`createCollection`](src/mcp/tools/collection/create.ts) | Collection | Create a new Payload collection with specified fields        |
| [`updateCollection`](src/mcp/tools/collection/update.ts) | Collection | Update existing Payload collections (fields, config, etc.)   |
| [`deleteCollection`](src/mcp/tools/collection/delete.ts) | Collection | Delete Payload collections and optionally remove from config |

### Jobs (Experimental)

| Tool                                    | Domain | Description            |
| --------------------------------------- | ------ | ---------------------- |
| [`create`](src/mcp/tools/job/create.ts) | Config | Create a new job       |
| [`create`](src/mcp/tools/job/run.ts)    | Config | Run a job              |
| [`create`](src/mcp/tools/job/update.ts) | Config | Update an existing job |

### Config (Experimental)

These tools are for interacting with the Payload Config. This experimental feature allows LLMS to understand and modify your Payload Config.

| Tool                                             | Domain | Description                                                      |
| ------------------------------------------------ | ------ | ---------------------------------------------------------------- |
| [`findConfig`](src/mcp/tools/config/find.ts)     | Config | Read and display the current Payload configuration file          |
| [`updateConfig`](src/mcp/tools/config/update.ts) | Config | Update the Payload configuration file with various modifications |

## Collection Tools (Experimental)

To use the collection management tools, you need to specify the paths to your collections directory and config file:

```typescript
import { buildConfig } from 'payload'
import { pluginMcp } from '@payloadcms/plugin-mcp'

export default buildConfig({
  // ... your existing config
  plugins: [
    pluginMcp({
      collections: {
        posts: true,
      },
      collectionsDirPath: 'src/collections',
      configFilePath: path.resolve(__dirname, 'src/payload.config.ts'), // must be absolute
      jobsDirPath: 'src/jobs',
    }),
  ],
})
```

**Notes:**

- **Collections Path**: Can be relative or absolute (e.g., `'src/collections'` or `/Users/user/project/src/collections`)
- **Config Path**: **Must be absolute** - use `path.resolve(__dirname, 'src/payload.config.ts')` or provide a full absolute path
- **Jobs Path**: Can be relative or absolute (e.g., `'src/jobs'` or `/Users/user/project/src/jobs`)
- **Absolute Paths**: You can also use absolute paths to manage collections and jobs in other Payload projects:
  ```typescript
  collectionsDirPath: '/Users/otheruser/projects/other-project/src/collections',
  configFilePath: '/Users/otheruser/projects/other-project/src/payload.config.ts',
  jobsDirPath: '/Users/otheruser/projects/other-project/src/jobs',
  ```
- **Cross-Project Support**: This allows you to manage collections in different projects from a single MCP endpoint

## Custom Tools

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

## Globals

This plugin adds global settings in your Payload admin to modify your MCP settings in real-time.

> IMPORTANT: Global Settings are Overwritten by Config level settings!

## Testing your MCP Server

Use [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test your MCP server:

```bash
npx @modelcontextprotocol/inspector
```

1. Go to `http://localhost:6274/`
2. Set Transport Type to `Streamable HTTP`
3. Set URL to `http://localhost:3000/api/mcp`
4. Press _Connect_
