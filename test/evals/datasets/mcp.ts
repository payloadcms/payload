import type { DefaultNodeTypes, DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import { NodeFormat } from '@payloadcms/richtext-lexical'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { EvalCase } from '../types.js'

import { getFinalAgentResponse, scoreMCPExecution } from '../utils/mcpToolCalls.js'

const datasetsDirectory = path.dirname(fileURLToPath(import.meta.url))
const uploadsFixtureDirectory = path.resolve(datasetsDirectory, '../../uploads')

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
    /** Allows the agent to read and base64-encode the local file before passing it to MCP. */
    additionalAllowedTools: ['Bash'],
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/uploads',
    input:
      'Upload the local file "checklist.jpg" to the media library and use "Local checklist icon" as its alt text.',
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs } = await payload.find({
        collection: 'media',
        where: { alt: { equals: 'Local checklist icon' } },
      })
      const media = docs[0]

      expect(docs).toHaveLength(1)
      expect(media?.mimeType).toBe('image/jpeg')
      expect(media?.filesize).toBeGreaterThan(0)

      const storedFile = await readFile(
        path.join(payload.collections.media.config.upload.staticDir, media!.filename),
      )
      const sourceFile = await readFile(
        path.join(uploadsFixtureDirectory, 'horizontal-squares.jpg'),
      )

      expect(storedFile).toEqual(sourceFile)
      const createCalls = audit.filter(
        (event) => event.type === 'mcp-tool-call' && event.name === 'createDocuments',
      )
      const createCall = createCalls[0]

      expect(createCalls).toHaveLength(1)
      expect(createCall?.input).toMatchObject({
        collectionSlug: 'media',
        documents: [
          {
            data: { alt: 'Local checklist icon' },
            file: { source: 'base64' },
          },
        ],
      })
      expect(createCall?.response.doc).toMatchObject({
        docs: [{ doc: { id: media!.id }, index: 0 }],
        errors: [],
      })

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 3,
        requiredPayloadOperation: { slug: 'media', kind: 'mutation' },
        transcript,
      })
    },
    workspaceFiles: [
      {
        sourcePath: path.join(uploadsFixtureDirectory, 'horizontal-squares.jpg'),
        targetPath: 'checklist.jpg',
      },
    ],
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/uploads',
    input:
      'Add this checklist icon to the media library and use "Checklist icon" as its alt text: https://raw.githubusercontent.com/payloadcms/payload/main/test/uploads/image.jpg',
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs } = await payload.find({
        collection: 'media',
        where: { alt: { equals: 'Checklist icon' } },
      })
      const media = docs[0]

      expect(docs).toHaveLength(1)
      expect(media?.mimeType).toBe('image/jpeg')
      expect(media?.filesize).toBeGreaterThan(0)

      const storedFile = await readFile(
        path.join(payload.collections.media.config.upload.staticDir, media!.filename),
      )

      expect(storedFile.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]))

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 3,
        requiredPayloadOperation: { slug: 'media', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/uploads',
    input:
      'Replace the file for the media item "Outdated checklist icon" with this updated image, and change its alt text to "Updated checklist icon": https://raw.githubusercontent.com/payloadcms/payload/main/test/uploads/image.jpg',
    setup: async ({ payload }) => {
      const originalFile = await readFile(path.join(uploadsFixtureDirectory, 'image.png'))

      await payload.create({
        collection: 'media',
        data: { alt: 'Outdated checklist icon' },
        file: {
          name: 'outdated-checklist-icon.png',
          data: originalFile,
          mimetype: 'image/png',
          size: originalFile.length,
        },
      })
    },
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs } = await payload.find({ collection: 'media' })
      const media = docs[0]

      expect(docs).toHaveLength(1)
      expect(media?.alt).toBe('Updated checklist icon')
      expect(media?.mimeType).toBe('image/jpeg')
      expect(media?.filesize).toBeGreaterThan(0)

      const storedFile = await readFile(
        path.join(payload.collections.media.config.upload.staticDir, media!.filename),
      )

      expect(storedFile.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]))

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 4,
        requiredPayloadOperation: { slug: 'media', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input: 'Create a post titled "Created by Payload MCP eval".',
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { title: { equals: 'Created by Payload MCP eval' } },
      })

      expect(docs).toHaveLength(1)

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 2,
        requiredPayloadOperation: { slug: 'posts', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'Create two posts in one request: one titled "First bulk MCP post" and one titled "Second bulk MCP post".',
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs } = await payload.find({
        collection: 'posts',
        sort: 'title',
        where: {
          title: { in: ['First bulk MCP post', 'Second bulk MCP post'] },
        },
      })
      const createCalls = audit.filter(
        (event) => event.type === 'mcp-tool-call' && event.name === 'createDocuments',
      )

      expect(docs.map(({ title }) => title)).toEqual([
        'First bulk MCP post',
        'Second bulk MCP post',
      ])
      expect(createCalls).toHaveLength(1)
      expect(createCalls[0]?.input).toMatchObject({
        collectionSlug: 'posts',
        documents: [
          { data: { title: 'First bulk MCP post' } },
          { data: { title: 'Second bulk MCP post' } },
        ],
      })

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 2,
        optimalToolCalls: 2,
        requiredPayloadOperation: { slug: 'posts', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input: 'Rename the post "MCP Update Target" to "Updated by Payload MCP eval".',
    setup: async ({ payload }) => {
      await payload.create({
        collection: 'posts',
        data: { title: 'MCP Update Target' },
      })
    },
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs } = await payload.find({
        collection: 'posts',
      })

      expect(docs).toHaveLength(1)
      expect(docs[0]?.title).toBe('Updated by Payload MCP eval')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 3,
        requiredPayloadOperation: { slug: 'posts', kind: 'mutation' },
        transcript,
      })
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
    verify: async ({ audit, expect, payload, transcript }) => {
      const deletedPosts = await payload.find({
        collection: 'posts',
        where: { title: { equals: 'MCP Delete Target' } },
      })
      const remainingPosts = await payload.find({
        collection: 'posts',
      })

      expect(deletedPosts.docs).toHaveLength(0)
      expect(remainingPosts.docs.map((post) => post.title)).toEqual(
        expect.arrayContaining(['MCP Keep', 'MCP Update Target']),
      )
      expect(remainingPosts.docs).toHaveLength(2)

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 2,
        requiredPayloadOperation: { slug: 'posts', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input: 'Change the site tagline to "Updated through Payload MCP".',
    verify: async ({ audit, expect, payload, transcript }) => {
      const settings = (await payload.findGlobal({ slug: 'site-settings' })) as {
        tagline?: unknown
      }

      expect(settings.tagline).toBe('Updated through Payload MCP')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 2,
        requiredPayloadOperation: {
          slug: 'site-settings',
          entityType: 'global',
          kind: 'mutation',
        },
        transcript,
      })
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
    verify: async ({ audit, expect, payload, transcript }) => {
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
      const relatedAuthorID =
        post?.author && typeof post.author === 'object'
          ? (post.author as Record<string, unknown>).id
          : post?.author

      expect(authors).toHaveLength(1)
      expect(posts).toHaveLength(1)
      expect(relatedAuthorID).toBe(author?.id)

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 3,
        requiredPayloadOperation: { slug: 'posts', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'Create a post titled "Lexical content created by Payload MCP eval" with an H2 heading "Release notes", a paragraph saying "Payload MCP is ready." with only "Payload MCP" in bold, and a bulleted list containing "Create content" and "Manage schemas".',
    verify: async ({ audit, expect, payload, transcript }) => {
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
      expect(docs).toHaveLength(1)
      expect(content?.root.type).toBe('root')
      expect(heading).toBeDefined()
      expect(paragraph).toBeDefined()
      expect(boldText).toBeDefined()
      expect(list).toBeDefined()
      expect(listItems).toEqual(expect.arrayContaining(['Create content', 'Manage schemas']))

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 2,
        requiredPayloadOperation: { slug: 'posts', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'The published article "MCP Draft Update Target" needs a correction, but it is not ready to go live. Change its title to "MCP Draft Update Saved" and save it as a draft without changing the published article.',
    setup: async ({ payload }) => {
      await payload.create({
        collection: 'articles',
        data: { _status: 'published', title: 'MCP Draft Update Target' },
        locale: 'en',
      })
    },
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs: draftArticles } = await payload.find({
        collection: 'articles',
        draft: true,
        locale: 'en',
        where: { title: { equals: 'MCP Draft Update Saved' } },
      })
      expect(draftArticles).toHaveLength(1)

      const draftArticle = draftArticles[0]
      const publishedArticle = await payload.findByID({
        id: draftArticle!.id,
        collection: 'articles',
        draft: false,
        locale: 'en',
      })

      expect(publishedArticle.title).toBe('MCP Draft Update Target')
      expect(publishedArticle._status).toBe('published')
      expect(draftArticle?.title).toBe('MCP Draft Update Saved')
      expect(draftArticle?._status).toBe('draft')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 3,
        requiredPayloadOperation: { slug: 'articles', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'Fix the title of the article "MCP Published Update Target" to "MCP Published Update Saved" and publish the corrected version now.',
    setup: async ({ payload }) => {
      await payload.create({
        collection: 'articles',
        data: { _status: 'published', title: 'MCP Published Update Target' },
        locale: 'en',
      })
    },
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs: publishedArticles } = await payload.find({
        collection: 'articles',
        draft: false,
        locale: 'en',
        where: { title: { equals: 'MCP Published Update Saved' } },
      })
      const publishedArticle = publishedArticles[0]

      expect(publishedArticles).toHaveLength(1)
      expect(publishedArticle?.title).toBe('MCP Published Update Saved')
      expect(publishedArticle?._status).toBe('published')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 3,
        requiredPayloadOperation: { slug: 'articles', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'Take the published article "MCP Unpublish Target" offline, but keep the article and its version history so it can still be edited as a draft. Do not delete it.',
    setup: async ({ payload }) => {
      await payload.create({
        collection: 'articles',
        data: { _status: 'published', title: 'MCP Unpublish Target' },
        locale: 'en',
      })
    },
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs: unpublishedArticles } = await payload.find({
        collection: 'articles',
        draft: false,
        locale: 'en',
        where: { title: { equals: 'MCP Unpublish Target' } },
      })
      const unpublishedArticle = unpublishedArticles[0]

      expect(unpublishedArticles).toHaveLength(1)
      expect(unpublishedArticle?._status).toBe('draft')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 3,
        requiredPayloadOperation: { slug: 'articles', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'Show me the currently published article titled "MCP Published Read Target". Ignore its newer unpublished draft.',
    setup: async ({ payload }) => {
      const article = await payload.create({
        collection: 'articles',
        data: { _status: 'published', title: 'MCP Published Read Target' },
        locale: 'en',
      })

      await payload.update({
        id: article.id,
        collection: 'articles',
        data: { title: 'MCP Draft Must Not Be Read' },
        draft: true,
        locale: 'en',
      })
    },
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs: publishedArticles } = await payload.find({
        collection: 'articles',
        draft: false,
        locale: 'en',
        where: { title: { equals: 'MCP Published Read Target' } },
      })
      expect(publishedArticles).toHaveLength(1)

      const publishedArticle = publishedArticles[0]
      const draftArticle = await payload.findByID({
        id: publishedArticle!.id,
        collection: 'articles',
        draft: true,
        locale: 'en',
      })
      const agentResponse = getFinalAgentResponse({ transcript })

      expect(publishedArticle?._status).toBe('published')
      expect(draftArticle.title).toBe('MCP Draft Must Not Be Read')
      expect(agentResponse).toContain('MCP Published Read Target')
      expect(agentResponse).not.toContain('MCP Draft Must Not Be Read')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 0,
        optimalToolCalls: 1,
        requiredPayloadOperation: {
          slug: 'articles',
          entityType: 'collection',
          kind: 'read',
        },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'Show me the latest draft of the article currently published as "MCP Draft Read Published Title".',
    setup: async ({ payload }) => {
      const article = await payload.create({
        collection: 'articles',
        data: { _status: 'published', title: 'MCP Draft Read Published Title' },
        locale: 'en',
      })

      await payload.update({
        id: article.id,
        collection: 'articles',
        data: { title: 'MCP Draft Read Latest Title' },
        draft: true,
        locale: 'en',
      })
    },
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs: draftArticles } = await payload.find({
        collection: 'articles',
        draft: true,
        locale: 'en',
        where: { title: { equals: 'MCP Draft Read Latest Title' } },
      })
      const storedDraft = draftArticles[0]
      const agentResponse = getFinalAgentResponse({ transcript })

      expect(draftArticles).toHaveLength(1)
      expect(storedDraft?._status).toBe('draft')
      expect(agentResponse).toContain('MCP Draft Read Latest Title')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 0,
        optimalToolCalls: 1,
        requiredPayloadOperation: {
          slug: 'articles',
          entityType: 'collection',
          kind: 'read',
        },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'For the article "MCP English Publish Target", change the English title to "MCP English Published Title" and publish only English. Leave the Spanish published title and Spanish draft unchanged.',
    setup: async ({ payload }) => {
      const article = await payload.create({
        collection: 'articles',
        data: { _status: 'published', title: 'MCP English Publish Target' },
        locale: 'en',
      })

      await payload.update({
        id: article.id,
        collection: 'articles',
        data: { _status: 'published', title: 'MCP Spanish Published Title' },
        draft: false,
        locale: 'es',
        publishAllLocales: false,
      })
      await payload.update({
        id: article.id,
        collection: 'articles',
        data: { title: 'MCP Spanish Draft Title' },
        draft: true,
        locale: 'es',
      })
    },
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs: publishedEnglishArticles } = await payload.find({
        collection: 'articles',
        draft: false,
        locale: 'en',
        where: { title: { equals: 'MCP English Published Title' } },
      })
      expect(publishedEnglishArticles).toHaveLength(1)

      const publishedEnglish = publishedEnglishArticles[0]
      const publishedSpanish = await payload.findByID({
        id: publishedEnglish!.id,
        collection: 'articles',
        draft: false,
        locale: 'es',
      })
      const draftSpanish = await payload.findByID({
        id: publishedEnglish!.id,
        collection: 'articles',
        draft: true,
        locale: 'es',
      })

      expect(publishedEnglish?.title).toBe('MCP English Published Title')
      expect(publishedEnglish?._status).toBe('published')
      expect(publishedSpanish.title).toBe('MCP Spanish Published Title')
      expect(publishedSpanish._status).toBe('published')
      expect(draftSpanish.title).toBe('MCP Spanish Draft Title')
      expect(draftSpanish._status).toBe('draft')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 3,
        requiredPayloadOperation: { slug: 'articles', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input:
      'Create a new article titled "MCP Newly Created Draft" as a draft. Leave it unpublished.',
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs } = await payload.find({
        collection: 'articles',
        draft: true,
        locale: 'en',
        where: { title: { equals: 'MCP Newly Created Draft' } },
      })
      const article = docs[0]

      expect(docs).toHaveLength(1)
      expect(article?._status).toBe('draft')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 2,
        requiredPayloadOperation: { slug: 'articles', kind: 'mutation' },
        transcript,
      })
    },
  },
  {
    bootConfig: true,
    category: 'mcp',
    configPath: 'mcp/shared',
    input: 'Create and publish a new article titled "MCP Newly Created Published".',
    verify: async ({ audit, expect, payload, transcript }) => {
      const { docs } = await payload.find({
        collection: 'articles',
        draft: false,
        locale: 'en',
        where: { title: { equals: 'MCP Newly Created Published' } },
      })
      const article = docs[0]

      expect(docs).toHaveLength(1)
      expect(article?._status).toBe('published')

      return scoreMCPExecution({
        audit,
        optimalModificationAttempts: 1,
        optimalToolCalls: 2,
        requiredPayloadOperation: { slug: 'articles', kind: 'mutation' },
        transcript,
      })
    },
  },
]
