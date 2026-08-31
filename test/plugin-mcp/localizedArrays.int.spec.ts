import { describe, expect } from 'vitest'

import { getToolDoc } from './helpers/mcpClient.js'
import { getApiKey, it, payload } from './helpers/mcpFixtures.js'

type LocalizedItemsAllLocales = {
  id: number | string
  items?: Record<string, Array<{ id: string; label: string; rel: number | string }>>
  rows?: Array<{ id: string; label: Record<string, string>; rel: number | string }>
  title?: string
}

const collectionSlug = 'localized-items'

describe('localized arrays', () => {
  it('should keep other locales intact when updating a localized array in one locale', async ({
    mcp,
  }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: `localized-array-user-1-${Date.now()}@example.com`, password: 'test1234' },
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: collectionSlug,
      data: { items: [{ label: 'english label', rel: user.id }], title: 'localized array' },
      locale: 'en',
    })

    const apiKey = await getApiKey()
    const client = await mcp.connect(apiKey)
    const updateResponse = await client.callTool({
      name: 'updateDocument',
      arguments: {
        id: doc.id,
        collectionSlug,
        data: { items: [{ label: 'spanish label', rel: user.id }] },
        locale: 'es',
      },
    })

    expect(updateResponse.isError).toBeFalsy()

    const allLocales = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      depth: 0,
      locale: 'all',
    })) as unknown as LocalizedItemsAllLocales

    expect(allLocales.items?.en?.[0]?.label).toBe('english label')
    expect(allLocales.items?.en?.[0]?.rel).toBe(user.id)
    expect(allLocales.items?.es?.[0]?.label).toBe('spanish label')
    expect(allLocales.items?.es?.[0]?.rel).toBe(user.id)

    await payload.delete({ id: doc.id, collection: collectionSlug })
    await payload.delete({ id: user.id, collection: 'users' })
  })

  it('should generate new row ids when an update echoes row ids read from another locale', async ({
    mcp,
  }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: `localized-array-user-2-${Date.now()}@example.com`, password: 'test1234' },
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: collectionSlug,
      data: { items: [{ label: 'english label', rel: user.id }], title: 'echoed row ids' },
      locale: 'en',
    })

    const apiKey = await getApiKey()
    const client = await mcp.connect(apiKey)

    // Read without a locale — returns the default locale's rows including their row ids
    const findResponse = await client.callTool({
      name: 'findDocuments',
      arguments: { id: doc.id, collectionSlug, depth: 0 },
    })
    const findText = (findResponse.content as Array<{ text: string; type: string }>)[0]!.text
    const found = JSON.parse(findText.slice(findText.indexOf('{'))) as {
      items: Array<{ id: string; label: string; rel: number | string }>
    }

    // Update another locale echoing those row ids back, the way an MCP client naturally does
    const updateResponse = await client.callTool({
      name: 'updateDocument',
      arguments: {
        id: doc.id,
        collectionSlug,
        data: { items: found.items.map((row) => ({ ...row, label: 'spanish label' })) },
        locale: 'es',
      },
    })

    expect(updateResponse.isError).toBeFalsy()

    const allLocales = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      depth: 0,
      locale: 'all',
    })) as unknown as LocalizedItemsAllLocales

    expect(allLocales.items?.en?.[0]?.label).toBe('english label')
    expect(allLocales.items?.en?.[0]?.rel).toBe(user.id)
    expect(allLocales.items?.es?.[0]?.label).toBe('spanish label')
    expect(allLocales.items?.es?.[0]?.rel).toBe(user.id)
    // The echoed en row id must not be stored under es as well
    expect(allLocales.items?.es?.[0]?.id).not.toBe(allLocales.items?.en?.[0]?.id)

    await payload.delete({ id: doc.id, collection: collectionSlug })
    await payload.delete({ id: user.id, collection: 'users' })
  })

  it('should keep row ids that belong to the locale being updated', async ({ mcp }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: `localized-array-user-3-${Date.now()}@example.com`, password: 'test1234' },
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: collectionSlug,
      data: { items: [{ label: 'english label', rel: user.id }], title: 'same locale row ids' },
      locale: 'en',
    })
    const created = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      depth: 0,
      locale: 'en',
    })) as unknown as { items: Array<{ id: string }> }
    const rowId = created.items[0]!.id

    const apiKey = await getApiKey()
    const client = await mcp.connect(apiKey)
    // Partial row update in the same locale — omitted subfields merge from the existing row
    const updateResponse = await client.callTool({
      name: 'updateDocument',
      arguments: {
        id: doc.id,
        collectionSlug,
        data: { items: [{ id: rowId, label: 'english label v2' }] },
        locale: 'en',
      },
    })

    expect(updateResponse.isError).toBeFalsy()

    const updated = getToolDoc<{
      items: Array<{ id: string; label: string; rel: number | string }>
    }>(updateResponse)

    expect(updated.items[0]?.id).toBe(rowId)
    expect(updated.items[0]?.label).toBe('english label v2')
    expect(updated.items[0]?.rel).toBe(user.id)

    await payload.delete({ id: doc.id, collection: collectionSlug })
    await payload.delete({ id: user.id, collection: 'users' })
  })

  it('should keep row ids of non-localized arrays so localized subfields stay merged', async ({
    mcp,
  }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: `localized-array-user-4-${Date.now()}@example.com`, password: 'test1234' },
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: collectionSlug,
      data: { rows: [{ label: 'english row label', rel: user.id }], title: 'shared rows' },
      locale: 'en',
    })
    const created = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      depth: 0,
      locale: 'en',
    })) as unknown as { rows: Array<{ id: string }> }
    const rowId = created.rows[0]!.id

    const apiKey = await getApiKey()
    const client = await mcp.connect(apiKey)
    const updateResponse = await client.callTool({
      name: 'updateDocument',
      arguments: {
        id: doc.id,
        collectionSlug,
        data: { rows: [{ id: rowId, label: 'spanish row label', rel: user.id }] },
        locale: 'es',
      },
    })

    expect(updateResponse.isError).toBeFalsy()

    const allLocales = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      depth: 0,
      locale: 'all',
    })) as unknown as LocalizedItemsAllLocales

    expect(allLocales.rows?.[0]?.id).toBe(rowId)
    expect(allLocales.rows?.[0]?.label?.en).toBe('english row label')
    expect(allLocales.rows?.[0]?.label?.es).toBe('spanish row label')
    expect(allLocales.rows?.[0]?.rel).toBe(user.id)

    await payload.delete({ id: doc.id, collection: collectionSlug })
    await payload.delete({ id: user.id, collection: 'users' })
  })

  it('should strip row ids inside localized arrays when updating by where clause', async ({
    mcp,
  }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: `localized-array-user-5-${Date.now()}@example.com`, password: 'test1234' },
      overrideAccess: true,
    })
    const doc = await payload.create({
      collection: collectionSlug,
      data: { items: [{ label: 'english label', rel: user.id }], title: 'bulk update' },
      locale: 'en',
    })
    const created = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      depth: 0,
      locale: 'en',
    })) as unknown as { items: Array<{ id: string }> }

    const apiKey = await getApiKey()
    const client = await mcp.connect(apiKey)
    const updateResponse = await client.callTool({
      name: 'updateDocument',
      arguments: {
        collectionSlug,
        data: {
          items: [{ id: created.items[0]!.id, label: 'spanish label', rel: user.id }],
        },
        locale: 'es',
        where: { title: { equals: 'bulk update' } },
      },
    })

    expect(updateResponse.isError).toBeFalsy()

    const allLocales = (await payload.findByID({
      id: doc.id,
      collection: collectionSlug,
      depth: 0,
      locale: 'all',
    })) as unknown as LocalizedItemsAllLocales

    expect(allLocales.items?.en?.[0]?.label).toBe('english label')
    expect(allLocales.items?.es?.[0]?.label).toBe('spanish label')
    expect(allLocales.items?.es?.[0]?.id).not.toBe(allLocales.items?.en?.[0]?.id)

    await payload.delete({ id: doc.id, collection: collectionSlug })
    await payload.delete({ id: user.id, collection: 'users' })
  })
})
