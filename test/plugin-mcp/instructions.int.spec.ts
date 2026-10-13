import type { Payload } from 'payload'

import { buildEditorState } from '@payloadcms/richtext-lexical'
import { randomUUID } from 'node:crypto'
import { instructionsCollectionSlug } from 'payload/shared'
import { assert, expect, onTestFinished } from 'vitest'

import type { TestRBAC } from '../__helpers/plugins/rbac/index.js'
import type { RESTClient } from '../__helpers/shared/RESTClient.js'
import type { PayloadLlmInstruction } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { createMcpClient } from './helpers/mcpClient.js'

const additionalInstructions = buildEditorState<PayloadLlmInstruction['additionalInstructions']>({
  text: 'Keep page summaries under 100 words.',
})
const paragraph = additionalInstructions.root.children[0]

assert(paragraph?.type === 'paragraph')

const text = paragraph.children[0]

assert(text?.type === 'text')
text.format = 1

test.suite('Shared LLM instructions', { config: './config.ts' }, () => {
  for (const target of [
    { slug: 'pages', type: 'collection', name: 'getCollectionSchema', operation: 'create' },
    { slug: 'pages', type: 'collection', name: 'getCollectionSchema', operation: 'update' },
    { slug: 'site-settings', type: 'global', name: 'getGlobalSchema', operation: 'update' },
  ] as const) {
    test(`should return ${target.type} schemas with ${target.operation} access and no target read access`, async ({
      payload,
      restClient,
    }) => {
      await saveAdditionalInstructions({
        entitySlug: target.slug,
        entityType: target.type,
        payload,
      })

      const rbac: TestRBAC = {
        collections: Object.fromEntries(
          payload.config.collections
            .filter(({ slug }) => slug !== instructionsCollectionSlug)
            .map(({ slug }) => [slug, { read: false }]),
        ),
        globals: Object.fromEntries(
          payload.config.globals.map(({ slug }) => [slug, { read: false }]),
        ),
      }

      if (target.type === 'collection') {
        rbac.collections!.pages = {
          read: false,
          [target.operation === 'create' ? 'update' : 'create']: false,
        }
      }

      const client = await connectMcp({ payload, rbac, restClient })
      const response = await client.callTool({
        name: target.name,
        arguments: { slug: target.slug },
      })
      const configured =
        target.type === 'collection'
          ? payload.collections[target.slug].config.llmInstructions
          : payload.config.globals.find(({ slug }) => slug === target.slug)?.llmInstructions

      expect(response.isError).not.toBe(true)
      expect(response.structuredContent).toMatchObject({
        slug: target.slug,
        schema: expect.any(Object),
      })
      expect(response.structuredContent?.instructions).toBe(configured || undefined)
      expect(JSON.stringify(response.content)).not.toContain('Keep page summaries under 100 words.')
    })
  }

  for (const { target, name, slug } of [
    {
      target: { entitySlug: 'pages', entityType: 'collection' },
      name: 'getCollectionSchema',
      slug: 'pages',
    },
    {
      target: { entitySlug: 'site-settings', entityType: 'global' },
      name: 'getGlobalSchema',
      slug: 'site-settings',
    },
  ] as const) {
    test(`should return the same instructions alongside the ${name} schema through MCP and CLI`, async ({
      cli,
      payload,
      restClient,
    }) => {
      await saveAdditionalInstructions({ ...target, payload })

      const client = await connectMcp({ payload, restClient })
      const response = await client.callTool({ name, arguments: { slug } })
      const output = await cli(`${name} --slug ${slug} --json`)
      const cliResponse = JSON.parse(output.stdout)

      expect(response.isError).not.toBe(true)
      expect(cliResponse).toMatchObject({ result: { slug }, success: true })
      expect(cliResponse.result.instructions).toContain('**Keep page summaries under 100 words.**')
      expect(response.structuredContent).toMatchObject({
        slug,
        schema: expect.any(Object),
        instructions: cliResponse.result.instructions,
      })
      expect(response.content).toContainEqual({
        type: 'text',
        text: cliResponse.result.instructions,
      })
    })
  }

  test('should omit MCP schema instructions when none are configured or saved', async ({
    payload,
    restClient,
  }) => {
    const client = await connectMcp({ payload, restClient })
    const response = await client.callTool({
      name: 'getGlobalSchema',
      arguments: { slug: 'site-settings' },
    })

    expect(response.isError).not.toBe(true)
    expect(response.structuredContent).toMatchObject({ slug: 'site-settings' })
    expect(response.structuredContent).not.toHaveProperty('instructions')
    expect(response.content).toHaveLength(1)
  })

  for (const { target, input, name } of [
    {
      target: { entitySlug: 'pages', entityType: 'collection' },
      input: { slug: 'pages' },
      name: 'countDocuments',
    },
    {
      target: { entitySlug: 'site-settings', entityType: 'global' },
      input: { slug: 'site-settings' },
      name: 'findGlobal',
    },
    {
      target: { entitySlug: 'pages', entityType: 'collection' },
      input: { slug: 'pages', documents: [{ data: { title: 'New page' } }] },
      name: 'createDocuments',
    },
    {
      target: { entitySlug: 'site-settings', entityType: 'global' },
      input: { slug: 'site-settings', data: { siteName: 'New site name' } },
      name: 'updateGlobal',
    },
  ] as const) {
    test(`should omit instructions from MCP ${name} responses`, async ({ payload, restClient }) => {
      await saveAdditionalInstructions({ ...target, payload })

      const client = await connectMcp({ payload, restClient })
      const response = await client.callTool({ name, arguments: input })
      const text = JSON.stringify(response.content)

      expect(response.isError).not.toBe(true)
      expect(response.structuredContent ?? {}).not.toHaveProperty('instructions')
      expect(text).not.toContain('Use the configured layout blocks.')
      expect(text).not.toContain('Keep page summaries under 100 words.')
    })
  }
})

const connectMcp = async ({
  payload,
  rbac,
  restClient,
}: {
  payload: Payload
  rbac?: TestRBAC
  restClient: RESTClient
}) => {
  const { user } = await payload.login({ collection: 'users', data: devUser })
  const apiKey = randomUUID()

  assert(user)

  await payload.update({
    id: user.id,
    collection: 'users',
    data: { apiKey, rbac },
    overrideAccess: false,
    user,
  })

  const mcp = createMcpClient({ protocolEra: 'modern', restClient })

  onTestFinished(() => mcp.close())

  return mcp.connect(apiKey)
}

const saveAdditionalInstructions = async ({
  entitySlug,
  entityType,
  payload,
}: {
  entitySlug: string
  entityType: 'collection' | 'global'
  payload: Payload
}) => {
  const { user } = await payload.login({ collection: 'users', data: devUser })
  const doc = await payload.findByID({
    id: `${entityType}-${entitySlug}`,
    collection: instructionsCollectionSlug,
    overrideAccess: false,
    user,
  })

  return payload.update({
    id: doc.id,
    collection: instructionsCollectionSlug,
    data: { additionalInstructions },
    overrideAccess: false,
    user,
  })
}
