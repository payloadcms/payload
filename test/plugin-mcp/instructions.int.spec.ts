import type { Payload } from 'payload'

import { randomUUID } from 'node:crypto'
import { assert, expect, onTestFinished } from 'vitest'

import type { TestRBAC } from '../__helpers/plugins/rbac/index.js'
import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { createMcpClient } from './helpers/mcpClient.js'

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
      const targetConfig =
        target.type === 'collection'
          ? payload.collections[target.slug].config
          : payload.config.globals.find(({ slug }) => slug === target.slug)!
      const originalInstructions = targetConfig.llmInstructions

      if (target.type === 'global') {
        targetConfig.llmInstructions = 'Preserve existing site settings.'
        onTestFinished(() => {
          targetConfig.llmInstructions = originalInstructions
        })
      }

      const rbac: TestRBAC = {
        collections: Object.fromEntries(
          payload.config.collections.map(({ slug }) => [slug, { read: false }]),
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
    })
  }

  test('should return the same configured instructions through MCP and CLI', async ({
    cli,
    payload,
    restClient,
  }) => {
    const client = await connectMcp({ payload, restClient })
    const response = await client.callTool({
      name: 'getCollectionSchema',
      arguments: { slug: 'pages' },
    })
    const output = await cli('getCollectionSchema --slug pages --json')
    const cliResponse = JSON.parse(output.stdout)

    expect(response.isError).not.toBe(true)
    expect(cliResponse).toMatchObject({ result: { slug: 'pages' }, success: true })
    expect(cliResponse.result.instructions).toBe(payload.collections.pages.config.llmInstructions)
    expect(response.structuredContent).toMatchObject({
      slug: 'pages',
      schema: expect.any(Object),
      instructions: cliResponse.result.instructions,
    })
    expect(response.content).toContainEqual({
      type: 'text',
      text: cliResponse.result.instructions,
    })
  })

  test('should omit MCP schema instructions when none are configured', async ({
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

  for (const { input, name } of [
    { input: { slug: 'pages' }, name: 'countDocuments' },
    {
      input: { slug: 'site-settings' },
      name: 'findGlobal',
    },
    {
      input: { slug: 'pages', documents: [{ data: { title: 'New page' } }] },
      name: 'createDocuments',
    },
    {
      input: { slug: 'site-settings', data: { siteName: 'New site name' } },
      name: 'updateGlobal',
    },
  ]) {
    test(`should omit instructions from MCP ${name} responses`, async ({ payload, restClient }) => {
      const client = await connectMcp({ payload, restClient })
      const response = await client.callTool({ name, arguments: input })
      const text = JSON.stringify(response.content)

      expect(response.isError).not.toBe(true)
      expect(response.structuredContent ?? {}).not.toHaveProperty('instructions')
      expect(text).not.toContain('Use the configured layout blocks.')
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
  restClient: NextRESTClient
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
