import type { EvalCase } from '../types.js'

const postTitle = 'Created by Payload MCP eval'

export const mcpDataset: EvalCase[] = [
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/create-post',
    input: `Create a new post titled "${postTitle}" using the Payload MCP tools. Do not modify payload.config.ts.`,
    verify: async ({ expect, payload }) => {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { title: { equals: postTitle } },
      })

      expect(docs).toHaveLength(1)
    },
  },
]
