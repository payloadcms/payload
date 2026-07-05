import type { EvalCase } from '../types.js'

const postTitle = 'Created by Payload MCP eval'

export const mcpDataset: EvalCase[] = [
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/create-post',
    input: `Create a new post titled "${postTitle}" using the Payload MCP tools. Do not modify payload.config.ts.`,
    verify: async ({ expect, mcpToolCalls, payload }) => {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { title: { equals: postTitle } },
      })

      expect(docs).toHaveLength(1)
      // Ensure the post left in the database is the exact one created through MCP.
      // This ensures the agent didn't cheat and create a post through the Payload API / REST API directly, bypassing the MCP
      const createCall = mcpToolCalls.find((call) => {
        const input = call.input as { collectionSlug?: unknown; data?: { title?: unknown } }
        return (
          call.name === 'createDocument' &&
          !call.response.isError &&
          input.collectionSlug === 'posts' &&
          input.data?.title === postTitle
        )
      })
      expect(createCall?.response.doc?.id).toBe(docs[0]!.id)
    },
  },
]
