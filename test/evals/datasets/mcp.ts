import type { DefaultNodeTypes, DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import { NodeFormat } from '@payloadcms/richtext-lexical'

import type { EvalCase } from '../types.js'

import {
  expectMCPDocumentRead,
  expectMCPToolCall,
  scoreMCPToolCallFailures,
} from '../utils/mcpToolCalls.js'

function lexicalNodes({ nodes }: { nodes: DefaultNodeTypes[] }): DefaultNodeTypes[] {
  return nodes.flatMap((node) => [
    node,
    ...('children' in node ? lexicalNodes({ nodes: node.children }) : []),
  ])
}

function lexicalText({ node }: { node: DefaultNodeTypes }): string {
  if (node.type === 'text') {
    return node.text
  }
  return 'children' in node
    ? node.children.map((child) => lexicalText({ node: child })).join('')
    : ''
}

export const mcpDataset: EvalCase[] = [
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input: 'Create a post titled "Created by Payload MCP eval".',
    verify: async ({ expect, mcpToolCalls, payload }) => {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { title: { equals: 'Created by Payload MCP eval' } },
      })

      expect(docs).toHaveLength(1)

      expectMCPToolCall({
        name: 'createDocument',
        expect,
        input: {
          collectionSlug: 'posts',
          data: { title: 'Created by Payload MCP eval' },
        },
        mcpToolCalls,
        response: { doc: { id: docs[0]!.id } },
      })

      return scoreMCPToolCallFailures({ mcpToolCalls })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input: 'Rename the post "MCP Update Target" to "Updated by Payload MCP eval" and publish it.',
    setup: async ({ payload }) => {
      await payload.create({
        collection: 'posts',
        data: { title: 'MCP Update Target' },
      })
    },
    verify: async ({ expect, mcpToolCalls, payload }) => {
      const foundPost = expectMCPDocumentRead({
        expect,
        matchesDocument: (document) => document.title === 'MCP Update Target',
        mcpToolCalls,
      })
      const { docs } = await payload.find({
        collection: 'posts',
        where: { title: { equals: 'Updated by Payload MCP eval' } },
      })

      expect(docs).toHaveLength(1)
      expect((docs[0] as { status?: unknown }).status).toBe('published')

      expectMCPToolCall({
        name: 'updateDocument',
        expect,
        input: {
          id: foundPost.id,
          collectionSlug: 'posts',
          data: { status: 'published', title: 'Updated by Payload MCP eval' },
        },
        mcpToolCalls,
        response: { doc: { id: docs[0]!.id } },
      })

      return scoreMCPToolCallFailures({ mcpToolCalls })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input: 'Delete the post titled "MCP Delete Target".',
    setup: async ({ payload }) => {
      for (const title of ['MCP Delete Target', 'MCP Keep', 'MCP Update Target']) {
        await payload.create({ collection: 'posts', data: { title } })
      }
    },
    verify: async ({ expect, mcpToolCalls, payload }) => {
      const foundPost = expectMCPDocumentRead({
        expect,
        matchesDocument: (document) => document.title === 'MCP Delete Target',
        mcpToolCalls,
      })
      const deletedPosts = await payload.find({
        collection: 'posts',
        where: { title: { equals: 'MCP Delete Target' } },
      })
      const remainingPosts = await payload.find({
        collection: 'posts',
      })

      expectMCPToolCall({
        name: 'deleteDocuments',
        expect,
        input: { id: foundPost.id, collectionSlug: 'posts' },
        mcpToolCalls,
        response: { doc: { id: foundPost.id } },
      })
      expect(deletedPosts.docs).toHaveLength(0)
      expect(remainingPosts.docs.map((post) => post.title)).toEqual(
        expect.arrayContaining(['MCP Keep', 'MCP Update Target']),
      )
      expect(remainingPosts.docs).toHaveLength(2)

      return scoreMCPToolCallFailures({ mcpToolCalls })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input: 'Change the site tagline to "Updated through Payload MCP".',
    verify: async ({ expect, mcpToolCalls, payload }) => {
      expectMCPToolCall({
        name: 'updateGlobal',
        expect,
        input: {
          data: { tagline: 'Updated through Payload MCP' },
          globalSlug: 'site-settings',
        },
        mcpToolCalls,
        response: { doc: { tagline: 'Updated through Payload MCP' } },
      })
      const settings = (await payload.findGlobal({ slug: 'site-settings' })) as {
        tagline?: unknown
      }

      expect(settings.tagline).toBe('Updated through Payload MCP')

      return scoreMCPToolCallFailures({ mcpToolCalls })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input: 'Create a post titled "Relationship created by Payload MCP eval" by Ada Lovelace.',
    setup: async ({ payload }) => {
      await payload.create({
        collection: 'authors',
        data: { name: 'Ada Lovelace' },
      })
    },
    verify: async ({ expect, mcpToolCalls, payload }) => {
      const { docs: authors } = await payload.find({
        collection: 'authors',
        where: { name: { equals: 'Ada Lovelace' } },
      })
      const { docs: posts } = await payload.find({
        collection: 'posts',
        depth: 0,
        where: { title: { equals: 'Relationship created by Payload MCP eval' } },
      })
      const author = authors[0] as Record<string, unknown> | undefined
      const post = posts[0] as Record<string, unknown> | undefined
      expectMCPDocumentRead({
        expect,
        matchesDocument: (document) =>
          document.name === 'Ada Lovelace' && document.id === author?.id,
        mcpToolCalls,
      })
      const relatedAuthorID =
        post?.author && typeof post.author === 'object'
          ? (post.author as Record<string, unknown>).id
          : post?.author

      expect(authors).toHaveLength(1)
      expect(posts).toHaveLength(1)
      expect(relatedAuthorID).toBe(author?.id)

      expectMCPToolCall({
        name: 'createDocument',
        expect,
        input: {
          collectionSlug: 'posts',
          data: {
            author: author?.id,
            title: 'Relationship created by Payload MCP eval',
          },
        },
        mcpToolCalls,
        response: { doc: { id: post?.id } },
      })

      return scoreMCPToolCallFailures({ mcpToolCalls })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'Create a post titled "Lexical content created by Payload MCP eval" with an H2 heading "Release notes", a paragraph saying "Payload MCP is ready." with only "Payload MCP" in bold, and a bulleted list containing "Create content" and "Manage schemas".',
    verify: async ({ expect, mcpToolCalls, payload }) => {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { title: { equals: 'Lexical content created by Payload MCP eval' } },
      })
      const post = docs[0] as Record<string, unknown> | undefined
      const content = post?.content as DefaultTypedEditorState | undefined
      const nodes = lexicalNodes({ nodes: content?.root.children ?? [] })
      const heading = nodes.find(
        (node) =>
          node.type === 'heading' &&
          node.tag === 'h2' &&
          lexicalText({ node }).includes('Release notes'),
      )
      const paragraph = nodes.find(
        (node) =>
          node.type === 'paragraph' && lexicalText({ node }).includes('Payload MCP is ready.'),
      )
      const boldText = nodes.find(
        (node) =>
          node.type === 'text' && node.text === 'Payload MCP' && node.format === NodeFormat.IS_BOLD,
      )
      const list = nodes.find((node) => node.type === 'list' && node.listType === 'bullet')
      const listItems = nodes
        .filter((node) => node.type === 'listitem')
        .map((node) => lexicalText({ node }))
      expectMCPToolCall({
        name: 'createDocument',
        expect,
        input: {
          collectionSlug: 'posts',
          data: {
            title: 'Lexical content created by Payload MCP eval',
          },
        },
        mcpToolCalls,
        response: { doc: { id: post?.id, content } },
      })

      expect(docs).toHaveLength(1)
      expect(content?.root.type).toBe('root')
      expect(heading).toBeDefined()
      expect(paragraph).toBeDefined()
      expect(boldText).toBeDefined()
      expect(list).toBeDefined()
      expect(listItems).toEqual(expect.arrayContaining(['Create content', 'Manage schemas']))

      return scoreMCPToolCallFailures({ mcpToolCalls })
    },
  },
]
