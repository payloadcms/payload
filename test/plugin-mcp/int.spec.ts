import type { Payload } from 'payload'

import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { capturedMcpEvents } from './config.js'

let payload: Payload
let token: string
let userId: string
let restClient: NextRESTClient

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function parseStreamResponse(response: Response): Promise<any> {
  try {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    let streamData = ''
    while (true) {
      const { done, value } = (await reader?.read()) || { done: false, value: new Uint8Array() }
      if (done) {
        break
      }
      streamData += decoder.decode(value, { stream: true })
    }

    const streamJSONDataLine = streamData
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('data:'))
      .pop()

    const streamJSONString = streamJSONDataLine
      ? streamJSONDataLine.slice('data:'.length).trim()
      : streamData.trim()

    return JSON.parse(streamJSONString)
  } catch (error) {
    console.error(error)
    throw error
  }
}

const getApiKey = async (
  enableUpdate: boolean = false,
  enableDelete: boolean = false,
  globalFind: boolean = false,
  globalUpdate: boolean = false,
): Promise<string> => {
  const doc = await payload.create({
    collection: 'payload-mcp-api-keys',
    data: {
      enableAPIKey: true,
      label: 'Test API Key',
      posts: { create: true, delete: enableDelete, find: true, update: enableUpdate },
      products: { find: true },
      ...(globalFind || globalUpdate
        ? { siteSettings: { find: globalFind, update: globalUpdate } }
        : {}),
      apiKey: randomUUID(),
      user: userId,
    },
  })

  return doc.apiKey as string
}

describe('@payloadcms/plugin-mcp', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())

    // @ts-expect-error - data is not a valid property
    token = data.token
    // @ts-expect-error - data.user is a valid property
    userId = data.user.id
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should ping', async () => {
    const apiKey = await getApiKey()
    const response = await restClient.POST('/mcp', {
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'ping',
        params: {},
      }),
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const json = await parseStreamResponse(response)
    expect(json).toBeDefined()
  })

  describe('Create MCP Handler', () => {
    it('should invoke onEvent callback when MCP requests are processed', async () => {
      capturedMcpEvents.length = 0

      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()

      // Events are emitted asynchronously after the response stream completes
      await vi.waitFor(() => expect(capturedMcpEvents.length).toBeGreaterThan(0), {
        timeout: 2000,
        interval: 100,
      })
    })

    it('should capture events for multiple sequential requests', async () => {
      capturedMcpEvents.length = 0

      const apiKey = await getApiKey()

      // First request
      await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'ping',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const eventsAfterFirst = capturedMcpEvents.length

      // Second request
      await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 2,
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      expect(capturedMcpEvents.length).toBeGreaterThan(eventsAfterFirst)
    })
  })

  describe('API Keyed Access', () => {
    it('should create an API Key', async () => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          apiKey: randomUUID(),
          enableAPIKey: true,
          label: 'Test API Key',
          posts: { create: true, find: true },
          products: { find: true },
          user: userId,
        },
      })

      expect(doc).toBeDefined()
      expect(doc.user).toBeDefined()
      // @ts-expect-error - doc.user is a string | User
      expect(doc.user?.id).toBe(userId)
      expect(doc.label).toBe('Test API Key')
      expect(doc.posts?.find).toBe(true)
      expect(doc.posts?.create).toBe(true)
      expect(doc['payload-mcp-tool']?.['diceRoll']).toBe(true)
      expect(doc['payload-mcp-resource']?.['data']).toBe(true)
      expect(doc['payload-mcp-resource']?.['dataByID']).toBe(true)
      expect(doc['payload-mcp-prompt']?.['echo']).toBe(true)
      expect(doc.products?.find).toBe(true)
      expect(doc.products?.create).toBe(false)
      expect(doc.products?.update).toBe(false)
      expect(doc.products?.delete).toBe(false)
      expect(doc.media?.find).toBe(false)
      expect(doc.media?.update).toBe(false)
      expect(typeof doc.apiKey).toBe('string')
      expect(doc.apiKey).toHaveLength(36)
      expect(doc.override).toBe('This field added by overrideApiKeyCollection')
    })

    it('should not allow GET /api/mcp', async () => {
      const apiKey = await getApiKey()
      const data = await restClient
        .GET(`/mcp`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })
        .then((res) => res.json())

      expect(data).toBeDefined()
      // @ts-expect-error - data is a valid property
      expect(data.jsonrpc).toBe('2.0')
      // @ts-expect-error - data is a valid property
      expect(data.error).toBeDefined()
      // @ts-expect-error - data is a valid property
      expect(data.error.code).toBe(-32000)
      // @ts-expect-error - data is a valid property
      expect(data.error.message).toBe('Method not allowed.')
    })

    it('should not allow POST /api/mcp with unauthorized API key', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({}),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer fake${apiKey}key`,
          'Content-Type': 'application/json',
        },
      })

      const json: any = await response.json()

      expect(response.status).toBe(401)
      expect(json?.errors).toBeDefined()
      expect(json.errors[0].message).toBe(
        'Unauthorized, you must be logged in to make this request.',
      )
    })
  })

  describe('List', () => {
    it('should list tools', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)
      expect(json).toBeDefined()
      expect(json.id).toBe(1)
      expect(json.jsonrpc).toBe('2.0')
      expect(json.result).toBeDefined()
      expect(json.result.tools).toBeDefined()
      expect(json.result.tools).toHaveLength(4)
      expect(json.result.tools[0].name).toBe('findProducts')
      expect(json.result.tools[0].description).toContain(
        'Find documents in a collection by ID or where clause using Find or FindByID.',
      )
      expect(json.result.tools[0].inputSchema).toBeDefined()
      expect(json.result.tools[1].name).toBe('createPosts')
      expect(json.result.tools[1].description).toContain(
        'This is a Payload collection with Post documents.',
      )
      expect(json.result.tools[1].inputSchema).toBeDefined()
      expect(json.result.tools[2].name).toBe('findPosts')
      expect(json.result.tools[2].description).toContain(
        'This is a Payload collection with Post documents.',
      )
      expect(json.result.tools[2].inputSchema).toBeDefined()
      expect(json.result.tools[3].name).toBe('diceRoll')
      expect(json.result.tools[3].description).toContain(
        'Rolls a virtual dice with a specified number of sides',
      )
      expect(json.result.tools[3].inputSchema).toBeDefined()

      // Input Schemas
      expect(json.result.tools[0].inputSchema).toBeDefined()
      expect(json.result.tools[0].inputSchema.required).not.toBeDefined()
      expect(json.result.tools[0].inputSchema.type).toBe('object')
      expect(json.result.tools[0].inputSchema.additionalProperties).toBe(false)
      expect(json.result.tools[0].inputSchema.$schema).toBe(
        'http://json-schema.org/draft-07/schema#',
      )
      expect(json.result.tools[0].inputSchema.properties).toBeDefined()
      expect(json.result.tools[0].inputSchema.properties.id).toBeDefined()
      expect(json.result.tools[0].inputSchema.properties.id.type).toHaveLength(2)
      expect(json.result.tools[0].inputSchema.properties.id.type[0]).toBe('string')
      expect(json.result.tools[0].inputSchema.properties.id.type[1]).toBe('number')
      expect(json.result.tools[0].inputSchema.properties.id.description).toContain(
        'Optional: specific document ID to retrieve. If not provided, returns all documents',
      )
      expect(json.result.tools[0].inputSchema.properties.fallbackLocale).toBeDefined()
      expect(json.result.tools[0].inputSchema.properties.fallbackLocale.type).toBe('string')
      expect(json.result.tools[0].inputSchema.properties.fallbackLocale.description).toContain(
        'Optional: fallback locale code to use when requested locale is not available',
      )
      expect(json.result.tools[0].inputSchema.properties.limit).toBeDefined()
      expect(json.result.tools[0].inputSchema.properties.limit.type).toBe('integer')
      expect(json.result.tools[0].inputSchema.properties.limit.minimum).toBe(1)
      expect(json.result.tools[0].inputSchema.properties.limit.maximum).toBe(100)
      expect(json.result.tools[0].inputSchema.properties.limit.default).toBe(10)
      expect(json.result.tools[0].inputSchema.properties.limit.description).toContain(
        'Maximum number of documents to return (default: 10, max: 100)',
      )
      expect(json.result.tools[0].inputSchema.properties.locale).toBeDefined()
      expect(json.result.tools[0].inputSchema.properties.locale.type).toBe('string')
      expect(json.result.tools[0].inputSchema.properties.locale.description).toContain(
        'Optional: locale code to retrieve data in (e.g., "en", "es"). Use "all" to retrieve all locales for localized fields',
      )
      expect(json.result.tools[0].inputSchema.properties.page).toBeDefined()
      expect(json.result.tools[0].inputSchema.properties.page.type).toBe('integer')
      expect(json.result.tools[0].inputSchema.properties.page.minimum).toBe(1)
      expect(json.result.tools[0].inputSchema.properties.page.default).toBe(1)
      expect(json.result.tools[0].inputSchema.properties.page.description).toContain(
        'Page number for pagination (default: 1)',
      )
      expect(json.result.tools[0].inputSchema.properties.sort).toBeDefined()
      expect(json.result.tools[0].inputSchema.properties.sort.type).toBe('string')
      expect(json.result.tools[0].inputSchema.properties.sort.description).toContain(
        'Field to sort by (e.g., "createdAt", "-updatedAt" for descending)',
      )
      expect(json.result.tools[0].inputSchema.properties.where).toBeDefined()
      expect(json.result.tools[0].inputSchema.properties.where.type).toBe('string')
      expect(json.result.tools[0].inputSchema.properties.where.description).toContain(
        'Optional JSON string for where clause filtering (e.g., \'{"title": {"contains": "test"}}\')',
      )

      expect(json.result.tools[1].inputSchema).toBeDefined()
      expect(json.result.tools[1].inputSchema.required).toBeDefined()
      expect(json.result.tools[1].inputSchema.required).toHaveLength(1)
      expect(json.result.tools[1].inputSchema.required[0]).toBe('title')
      expect(json.result.tools[1].inputSchema.type).toBe('object')
      expect(json.result.tools[1].inputSchema.additionalProperties).toBe(false)
      expect(json.result.tools[1].inputSchema.$schema).toBe(
        'http://json-schema.org/draft-07/schema#',
      )
      expect(json.result.tools[1].inputSchema.properties).toBeDefined()
      expect(json.result.tools[1].inputSchema.properties.title).toBeDefined()
      expect(json.result.tools[1].inputSchema.properties.title.type).toBe('string')
      expect(json.result.tools[1].inputSchema.properties.title.description).toBe(
        'The title of the post',
      )
      expect(json.result.tools[1].inputSchema.properties.content).toBeDefined()
      expect(json.result.tools[1].inputSchema.properties.content.type).toHaveLength(2)
      expect(json.result.tools[1].inputSchema.properties.content.type[0]).toBe('string')
      expect(json.result.tools[1].inputSchema.properties.content.type[1]).toBe('null')
      expect(json.result.tools[1].inputSchema.properties.content.description).toBe(
        'The content of the post',
      )
      expect(json.result.tools[1].inputSchema.properties.author).toBeDefined()
      expect(json.result.tools[1].inputSchema.properties.author.type).toHaveLength(2)
      expect(['string', 'number']).toContain(
        json.result.tools[1].inputSchema.properties.author.type[0],
      )
      expect(json.result.tools[1].inputSchema.properties.author.type[1]).toBe('null')
      expect(json.result.tools[1].inputSchema.properties.author.description).toBe(
        'The author of the post',
      )
      expect(json.result.tools[1].inputSchema.properties.draft).toBeDefined()
      expect(json.result.tools[1].inputSchema.properties.draft.type).toBe('boolean')
      expect(json.result.tools[1].inputSchema.properties.draft.description).toBe(
        'Whether to create the document as a draft',
      )
      expect(json.result.tools[1].inputSchema.properties.fallbackLocale).toBeDefined()
      expect(json.result.tools[1].inputSchema.properties.fallbackLocale.type).toBe('string')
      expect(json.result.tools[1].inputSchema.properties.fallbackLocale.description).toBe(
        'Optional: fallback locale code to use when requested locale is not available',
      )
      expect(json.result.tools[1].inputSchema.properties.locale).toBeDefined()
      expect(json.result.tools[1].inputSchema.properties.locale.type).toBe('string')
      expect(json.result.tools[1].inputSchema.properties.locale.description).toBe(
        'Optional: locale code to create the document in (e.g., "en", "es"). Defaults to the default locale',
      )
      expect(json.result.tools[1].inputSchema.properties.select).toBeDefined()
      expect(json.result.tools[1].inputSchema.properties.select.type).toBe('string')
      expect(json.result.tools[1].inputSchema.properties.select.description).toContain(
        'Optional: define exactly which fields you\'d like to create (JSON), e.g., \'{"title": "My Post"}\'',
      )

      expect(json.result.tools[2].inputSchema).toBeDefined()
      expect(json.result.tools[2].inputSchema.required).not.toBeDefined()
      expect(json.result.tools[2].inputSchema.type).toBe('object')
      expect(json.result.tools[2].inputSchema.additionalProperties).toBe(false)
      expect(json.result.tools[2].inputSchema.$schema).toBe(
        'http://json-schema.org/draft-07/schema#',
      )
      expect(json.result.tools[2].inputSchema.properties).toBeDefined()
      expect(json.result.tools[2].inputSchema.properties.id).toBeDefined()
      expect(json.result.tools[2].inputSchema.properties.id.type).toHaveLength(2)
      expect(json.result.tools[2].inputSchema.properties.id.type[0]).toBe('string')
      expect(json.result.tools[2].inputSchema.properties.id.type[1]).toBe('number')
      expect(json.result.tools[2].inputSchema.properties.id.description).toContain(
        'Optional: specific document ID to retrieve. If not provided, returns all documents',
      )
      expect(json.result.tools[2].inputSchema.properties.fallbackLocale).toBeDefined()
      expect(json.result.tools[2].inputSchema.properties.fallbackLocale.type).toBe('string')
      expect(json.result.tools[2].inputSchema.properties.fallbackLocale.description).toBe(
        'Optional: fallback locale code to use when requested locale is not available',
      )
      expect(json.result.tools[2].inputSchema.properties.limit).toBeDefined()
      expect(json.result.tools[2].inputSchema.properties.limit.type).toBe('integer')
      expect(json.result.tools[2].inputSchema.properties.limit.minimum).toBe(1)
      expect(json.result.tools[2].inputSchema.properties.limit.maximum).toBe(100)
      expect(json.result.tools[2].inputSchema.properties.limit.default).toBe(10)
      expect(json.result.tools[2].inputSchema.properties.limit.description).toContain(
        'Maximum number of documents to return (default: 10, max: 100)',
      )
      expect(json.result.tools[2].inputSchema.properties.locale).toBeDefined()
      expect(json.result.tools[2].inputSchema.properties.locale.type).toBe('string')
      expect(json.result.tools[2].inputSchema.properties.locale.description).toContain(
        'Optional: locale code to retrieve data in (e.g., "en", "es"). Use "all" to retrieve all locales for localized fields',
      )
      expect(json.result.tools[2].inputSchema.properties.page).toBeDefined()
      expect(json.result.tools[2].inputSchema.properties.page.type).toBe('integer')
      expect(json.result.tools[2].inputSchema.properties.page.minimum).toBe(1)
      expect(json.result.tools[2].inputSchema.properties.page.default).toBe(1)
      expect(json.result.tools[2].inputSchema.properties.page.description).toContain(
        'Page number for pagination (default: 1)',
      )
      expect(json.result.tools[2].inputSchema.properties.sort).toBeDefined()
      expect(json.result.tools[2].inputSchema.properties.sort.type).toBe('string')
      expect(json.result.tools[2].inputSchema.properties.sort.description).toContain(
        'Field to sort by (e.g., "createdAt", "-updatedAt" for descending)',
      )
      expect(json.result.tools[2].inputSchema.properties.where).toBeDefined()
      expect(json.result.tools[2].inputSchema.properties.where.type).toBe('string')
      expect(json.result.tools[2].inputSchema.properties.where.description).toContain(
        'Optional JSON string for where clause filtering (e.g., \'{"title": {"contains": "test"}}\')',
      )
      expect(json.result.tools[2].inputSchema.properties.select).toBeDefined()
      expect(json.result.tools[2].inputSchema.properties.select.type).toBe('string')
      expect(json.result.tools[2].inputSchema.properties.select.description).toContain(
        "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
      )

      expect(json.result.tools[3].inputSchema).toBeDefined()
      expect(json.result.tools[3].inputSchema.required).not.toBeDefined()
      expect(json.result.tools[3].inputSchema.type).toBe('object')
      expect(json.result.tools[3].inputSchema.additionalProperties).toBe(false)
      expect(json.result.tools[3].inputSchema.$schema).toBe(
        'http://json-schema.org/draft-07/schema#',
      )
      expect(json.result.tools[3].inputSchema.properties).toBeDefined()
      expect(json.result.tools[3].inputSchema.properties.sides).toBeDefined()
      expect(json.result.tools[3].inputSchema.properties.sides.type).toBe('integer')
      expect(json.result.tools[3].inputSchema.properties.sides.minimum).toBe(2)
      expect(json.result.tools[3].inputSchema.properties.sides.maximum).toBe(1000)
      expect(json.result.tools[3].inputSchema.properties.sides.default).toBe(6)
      expect(json.result.tools[3].inputSchema.properties.sides.description).toContain(
        'Number of sides on the dice (default: 6)',
      )
    })

    it('should list resources', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'resources/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.id).toBe(1)
      expect(json.jsonrpc).toBe('2.0')
      expect(json.result).toBeDefined()
      expect(json.result.resources).toBeDefined()
      expect(json.result.resources).toHaveLength(1)
      expect(json.result.resources[0].name).toBe('data')
      expect(json.result.resources[0].title).toBe('Data')
      expect(json.result.resources[0].uri).toBe('data://app')
      expect(json.result.resources[0].description).toBe(
        'Data is a resource that contains special data.',
      )
      expect(json.result.resources[0].mimeType).toBe('text/plain')
    })

    it('should list prompts', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'prompts/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.id).toBe(1)
      expect(json.jsonrpc).toBe('2.0')
      expect(json.result).toBeDefined()
      expect(json.result.prompts).toBeDefined()
      expect(json.result.prompts).toHaveLength(1)
      expect(json.result.prompts[0].name).toBe('echo')
      expect(json.result.prompts[0].title).toBe('Echo Prompt')
      expect(json.result.prompts[0].description).toBe('Creates a prompt to process a message')
      expect(json.result.prompts[0].arguments).toBeDefined()
      expect(json.result.prompts[0].arguments).toHaveLength(1)
      expect(json.result.prompts[0].arguments[0].name).toBe('message')
      expect(json.result.prompts[0].arguments[0].required).toBe(true)
    })

    it('should list globals', async () => {
      const apiKey = await getApiKey(false, false, true, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.tools).toBeDefined()

      const findGlobalTool = json.result.tools.find((t: any) => t.name === 'findSiteSettings')
      expect(findGlobalTool).toBeDefined()
      expect(findGlobalTool.description).toContain('Payload global')
      expect(findGlobalTool.inputSchema.properties.select).toBeDefined()
      expect(findGlobalTool.inputSchema.properties.select.type).toBe('string')
      expect(findGlobalTool.inputSchema.properties.select.description).toContain(
        "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
      )

      const updateGlobalTool = json.result.tools.find((t: any) => t.name === 'updateSiteSettings')
      expect(updateGlobalTool).toBeDefined()
      expect(updateGlobalTool.description).toContain('Payload global')
      expect(updateGlobalTool.inputSchema.properties.select).toBeDefined()
      expect(updateGlobalTool.inputSchema.properties.select.type).toBe('string')
      expect(updateGlobalTool.inputSchema.properties.select.description).toContain(
        'Optional: define exactly which fields you\'d like to return in the response (JSON), e.g., \'{"siteName": "My Site"}\'',
      )
    })

    it('should list updatePosts when API key permits update and include select schema', async () => {
      const apiKey = await getApiKey(true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      const updateToolSchema = json.result.tools.find((t: any) => t.name === 'updatePosts')
      expect(updateToolSchema).toBeDefined()
      expect(updateToolSchema.inputSchema.properties.select).toBeDefined()
      expect(updateToolSchema.inputSchema.properties.select.type).toBe('string')
      expect(updateToolSchema.inputSchema.properties.select.description).toContain(
        'Optional: define exactly which fields you\'d like to return in the response (JSON), e.g., \'{"title": "My Post"}\'',
      )
    })
  })

  describe('Prompts', () => {
    it('should get echo prompt', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'prompts/get',
          params: {
            name: 'echo',
            arguments: {
              message: 'Hello, world!',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.messages).toHaveLength(2)
      expect(json.result.messages[0].content.type).toBe('text')
      expect(json.result.messages[0].content.text).toContain('This prompt was sent: Hello, world!')
      expect(json.result.messages[1].content.type).toBe('text')
      expect(json.result.messages[1].content.text).toContain(
        `This prompt was sent by userId: ${userId}`,
      )

      const { docs } = await payload.find({
        collection: 'modified-prompts',
        where: {
          user: {
            equals: userId,
          },
        },
      })

      const modifiedPrompt = docs?.[0]
      expect(modifiedPrompt?.original).toBe('Hello, world!')
      expect(modifiedPrompt?.modified).toBe('This prompt was sent: Hello, world!')
      // @ts-expect-error - doc.user is a string | User
      expect(modifiedPrompt?.user?.id).toBe(userId)
    })
  })

  describe('Resources', () => {
    it('should read the data resource', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'resources/read',
          params: {
            uri: 'data://app',
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.contents).toHaveLength(2)
      expect(json.result.contents[0].uri).toBe('data://app')
      expect(json.result.contents[0].text).toContain('My special data.')
      expect(json.result.contents[1].text).toContain(`This was requested by user: ${userId}`)

      const { docs } = await payload.find({
        collection: 'returned-resources',
        where: {
          user: {
            equals: userId,
          },
        },
      })

      const returnedResource = docs?.[0]
      expect(returnedResource?.uri).toBe('data://app')
      expect(returnedResource?.content).toBe('My special data.')
      // @ts-expect-error - doc.user is a string | User
      expect(returnedResource?.user?.id).toBe(userId)
    })

    it('should read the dataByID resource', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'resources/read',
          params: {
            uri: 'data://app/1',
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.contents).toHaveLength(2)
      expect(json.result.contents[0].uri).toBe('data://app/1')
      expect(json.result.contents[0].text).toContain('My special data for ID: 1')
      expect(json.result.contents[1].text).toContain(`This was requested by user: ${userId}`)

      const { docs } = await payload.find({
        collection: 'returned-resources',
        where: {
          user: {
            equals: userId,
          },
        },
      })

      const returnedResource = docs?.[0]
      expect(returnedResource?.uri).toBe('data://app/1')
      expect(returnedResource?.content).toBe('My special data for ID: 1')
      // @ts-expect-error - doc.user is a string | User
      expect(returnedResource?.user?.id).toBe(userId)
    })
  })

  describe('Custom MCP Tools', () => {
    it('should call diceRoll', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'diceRoll',
            arguments: {
              sides: 6,
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toHaveLength(1)
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain('**Sides:** 6')
      expect(json.result.content[0].text).toContain('**Result:**')
      expect(json.result.content[0].text).toContain('🎲 You rolled a **')
      expect(json.result.content[0].text).toContain('** on a 6-sided die!')

      const { docs } = await payload.find({
        collection: 'rolls',
        where: {
          user: {
            equals: userId,
          },
        },
      })

      const roll = docs?.[0]
      expect(roll?.sides).toBe(6)
      expect(roll?.result).toBeDefined()
      // @ts-expect-error - doc.user is a string | User
      expect(roll?.user?.id).toBe(userId)
    })
  })

  describe('Collections', () => {
    it('should call createPosts', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'createPosts',
            arguments: {
              content: 'Content for test post.',
              title: 'Test Post',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toHaveLength(2)
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain(
        'Resource created successfully in collection "posts"!',
      )
      expect(json.result.content[0].text).toContain('Created resource:')
      expect(json.result.content[0].text).toContain('```json')
      expect(json.result.content[0].text).toContain('"title":"Test Post"')
      expect(json.result.content[0].text).toContain('"content":"Content for test post."')
      expect(json.result.content[1].type).toBe('text')
      expect(json.result.content[1].text).toContain('Override MCP response for Posts!')
    })

    it('should call createPosts with select to limit returned fields', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'createPosts',
            arguments: {
              content: 'Content should be omitted',
              select: '{"title": true}',
              title: 'Select Create Post',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain('"title":"Select Create Post"')
      expect(json.result.content[0].text).not.toContain('Content should be omitted')
    })

    it('should call findPosts', async () => {
      await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for test post.',
          title: 'Test Post for Finding',
        },
      })

      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findPosts',
            arguments: {
              limit: 1,
              page: 1,
              where: '{"title": {"contains": "Test Post for Finding"}}',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toHaveLength(2)
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain('Collection: "posts"')
      expect(json.result.content[0].text).toContain('Total: 1 documents')
      expect(json.result.content[0].text).toContain('Page: 1 of 1')
      expect(json.result.content[0].text).toContain('```json')
      expect(json.result.content[0].text).toContain('"content":"Content for test post."')
      expect(json.result.content[1].type).toBe('text')
      expect(json.result.content[1].text).toContain('Override MCP response for Posts!')
    })

    it('should call findPosts with select and return only requested fields', async () => {
      await payload.create({
        collection: 'posts',
        data: {
          content: 'Content that should be omitted',
          title: 'Select Test Post',
        },
      })

      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findPosts',
            arguments: {
              limit: 1,
              page: 1,
              select: '{"title": true}',
              where: '{"title": {"contains": "Select Test Post"}}',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toHaveLength(2)
      const responseText: string = json.result.content[0].text
      expect(responseText).toContain('Collection: "posts"')
      expect(responseText).toContain('"title":"Select Test Post (MCP Hook Override)"')
      expect(responseText).not.toContain('"content": "Content that should be omitted"')
    })

    it('should call updatePosts', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for test post to update.',
          title: 'Test Post for Updating',
        },
      })

      const apiKey = await getApiKey(true, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updatePosts',
            arguments: {
              id: post.id,
              content: 'Updated content for test post to update.',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toHaveLength(2)
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain(
        'Document updated successfully in collection "posts"!',
      )
      expect(json.result.content[0].text).toContain('Updated document:')
      expect(json.result.content[0].text).toContain('```json')
      expect(json.result.content[0].text).toContain(
        '"content":"Updated content for test post to update."',
      )
    })

    it('should call updatePosts with nullable union type field set to null', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'Content to be cleared',
          title: 'Union Type Null Test',
        },
      })

      const apiKey = await getApiKey(true, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updatePosts',
            arguments: {
              id: post.id,
              content: null,
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain(
        'Document updated successfully in collection "posts"!',
      )
      expect(json.result.content[0].text).toContain('"content":null')

      await payload.delete({ id: post.id, collection: 'posts' })
    })

    it('should call updatePosts with relationship union type field', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'Union Type Relationship Test',
        },
      })

      const apiKey = await getApiKey(true, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updatePosts',
            arguments: {
              id: post.id,
              author: userId,
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain(
        'Document updated successfully in collection "posts"!',
      )

      const jsonMatch = json.result.content[0].text.match(/```json\n([\s\S]*?)\n```/)
      expect(jsonMatch).toBeDefined()
      const updatedDoc = JSON.parse(jsonMatch[1])
      expect(updatedDoc.author).toBe(userId)

      await payload.delete({ id: post.id, collection: 'posts' })
    })

    it('should call updatePosts with select to limit returned fields', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'Original content',
          title: 'Select Update Post',
        },
      })

      const apiKey = await getApiKey(true, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updatePosts',
            arguments: {
              id: post.id,
              content: 'Updated but should be omitted',
              select: '{"title": true}',
              title: 'Select Update Post Edited',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      const responseText: string = json.result.content[0].text
      expect(responseText).toContain('"title":"Select Update Post Edited"')
      expect(responseText).not.toContain('Updated but should be omitted')
      expect(responseText).not.toContain('"content":')
    })

    it('should call deletePosts', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for test post to delete.',
          title: 'Test Post for Deleting',
        },
      })

      const apiKey = await getApiKey(false, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'deletePosts',
            arguments: {
              id: post.id,
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toHaveLength(2)
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain(
        'Document deleted successfully from collection "posts"!',
      )
      expect(json.result.content[0].text).toContain('Deleted document:')
      expect(json.result.content[0].text).toContain('```json')
      expect(json.result.content[0].text).toContain('"content":"Content for test post to delete."')
    })

    it('should handle point fields with object format in createPosts', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'createPosts',
            arguments: {
              content: 'Testing point field transformation',
              location: {
                latitude: 40.7128,
                longitude: -74.006,
              },
              title: 'Post with Location',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toHaveLength(2)
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain('Resource created successfully')

      const jsonMatch = json.result.content[0].text.match(/```json\n([\s\S]*?)\n```/)
      expect(jsonMatch).toBeDefined()
      const createdDoc = JSON.parse(jsonMatch[1])

      expect(createdDoc.location).toEqual([-74.006, 40.7128])

      expect(json.result.content[1].type).toBe('text')
      expect(json.result.content[1].text).toContain('Override MCP response for Posts!')

      await payload.delete({ id: createdDoc.id, collection: 'posts' })
    })

    it('should handle point fields with object format in updatePosts', async () => {
      const apiKey = await getApiKey(true)

      const createdPost = await payload.create({
        collection: 'posts',
        data: {
          location: [-118.2437, 34.0522],
          title: 'Post to Update Location',
        },
      })

      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updatePosts',
            arguments: {
              id: createdPost.id,
              location: {
                latitude: 51.5074,
                longitude: -0.1278,
              },
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toHaveLength(2)
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain('Document updated successfully')

      const jsonMatch = json.result.content[0].text.match(/```json\n([\s\S]*?)\n```/)
      expect(jsonMatch).toBeDefined()
      const updatedDoc = JSON.parse(jsonMatch[1])

      expect(updatedDoc.location).toEqual([-0.1278, 51.5074])

      expect(json.result.content[1].type).toBe('text')
      expect(json.result.content[1].text).toContain('Override MCP response for Posts!')

      await payload.delete({ id: createdPost.id, collection: 'posts' })
    })
  })

  describe('Blocks fields', () => {
    const createdPageIds: (number | string)[] = []

    const getPagesApiKey = async (enableUpdate = false) => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          enableAPIKey: true,
          label: 'Pages API Key',
          pages: { create: true, find: true, update: enableUpdate, delete: true },
          posts: { create: false, find: false },
          products: { find: false },
          apiKey: randomUUID(),
          user: userId,
        },
      })
      return doc.apiKey as string
    }

    it('should create a page with a block', async () => {
      const apiKey = await getPagesApiKey()

      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'createPages',
            arguments: {
              title: 'Hero Page',
              layout: [
                {
                  blockType: 'hero',
                  heading: 'Welcome to our site',
                  subheading: 'Discover amazing things',
                },
              ],
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.isError).toBeFalsy()
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain('"title":"Hero Page"')
      expect(json.result.content[0].text).toContain('"blockType":"hero"')
      expect(json.result.content[0].text).toContain('"heading":"Welcome to our site"')

      const jsonMatch = json.result.content[0].text.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        createdPageIds.push(JSON.parse(jsonMatch[1]).id)
      }
    })

    it('should create a page with multiple block types', async () => {
      const apiKey = await getPagesApiKey()

      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'createPages',
            arguments: {
              title: 'Multi-block Page',
              layout: [
                {
                  blockType: 'hero',
                  heading: 'Page Hero',
                  subheading: 'Hero subtitle',
                },
                {
                  blockType: 'textContent',
                  body: 'This is the body text.',
                },
              ],
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.isError).toBeFalsy()
      expect(json.result.content[0].text).toContain('"blockType":"hero"')
      expect(json.result.content[0].text).toContain('"blockType":"textContent"')
      expect(json.result.content[0].text).toContain('"heading":"Page Hero"')
      expect(json.result.content[0].text).toContain('"body":"This is the body text."')

      const jsonMatch = json.result.content[0].text.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        createdPageIds.push(JSON.parse(jsonMatch[1]).id)
      }
    })

    it('should update a page layout that contains blocks', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'Page to Update',
          layout: [],
        },
      })

      createdPageIds.push(page.id)

      const apiKey = await getPagesApiKey(true)

      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updatePages',
            arguments: {
              id: page.id,
              layout: [
                {
                  blockType: 'hero',
                  heading: 'Updated Hero Heading',
                },
                {
                  blockType: 'textContent',
                  body: 'Updated body text.',
                },
              ],
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.isError).toBeFalsy()
      expect(json.result.content[0].text).toContain('"blockType":"hero"')
      expect(json.result.content[0].text).toContain('"heading":"Updated Hero Heading"')
      expect(json.result.content[0].text).toContain('"blockType":"textContent"')
      expect(json.result.content[0].text).toContain('"body":"Updated body text."')

      const updatedPage = await payload.findByID({
        collection: 'pages',
        id: page.id,
      })

      expect((updatedPage as any).layout).toHaveLength(2)
      expect((updatedPage as any).layout[0].blockType).toBe('hero')
      expect((updatedPage as any).layout[0].heading).toBe('Updated Hero Heading')
    })
  })

  describe('Virtual Fields', () => {
    it('should not include virtual fields in createPosts tool schema', async () => {
      const apiKey = await getApiKey(true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      const createTool = json.result.tools.find((t: any) => t.name === 'createPosts')
      expect(createTool).toBeDefined()
      expect(createTool.inputSchema.properties.computedTitle).toBeUndefined()
    })

    it('should not include virtual fields in updatePosts tool schema', async () => {
      const apiKey = await getApiKey(true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      const updateTool = json.result.tools.find((t: any) => t.name === 'updatePosts')
      expect(updateTool).toBeDefined()
      expect(updateTool.inputSchema.properties.computedTitle).toBeUndefined()
    })

    it('should ignore virtual fields when creating a post via MCP', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'createPosts',
            arguments: {
              title: 'Virtual Field Create Test',
              content: 'Testing virtual field exclusion on create',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain(
        'Resource created successfully in collection "posts"!',
      )
      expect(json.result.content[0].text).toContain('"title":"Virtual Field Create Test"')
      expect(json.result.content[0].text).not.toContain('"computedTitle"')

      // Clean up
      const createdId = JSON.parse(
        json.result.content[0].text.match(/```json\n([\s\S]*?)\n```/)?.[1] || '{}',
      ).id
      if (createdId) {
        await payload.delete({ id: createdId, collection: 'posts' })
      }
    })

    it('should ignore virtual fields when updating a post via MCP', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: { title: 'Virtual Field Update Test' },
      })

      const apiKey = await getApiKey(true, false)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updatePosts',
            arguments: {
              id: post.id,
              title: 'Virtual Field Updated Title',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain('Document updated successfully')
      expect(json.result.content[0].text).toContain('"title":"Virtual Field Updated Title"')
      expect(json.result.content[0].text).not.toContain('"computedTitle"')

      await payload.delete({ id: post.id, collection: 'posts' })
    })
  })

  describe('payloadAPI context', () => {
    it('should call operations with the payloadAPI context as MCP', async () => {
      await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for test post.',
          title: 'Test Post for Finding',
        },
      })

      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findPosts',
            arguments: {
              limit: 1,
              page: 1,
              where: '{"title": {"contains": "Test Post for Finding"}}',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toHaveLength(2)
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain(
        '"title":"Test Post for Finding (MCP Hook Override)"',
      )
    })

    it('should find site-settings global', async () => {
      const apiKey = await getApiKey(false, false, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findSiteSettings',
            arguments: {},
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toBeDefined()
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain('Global "site-settings"')
      expect(json.result.content[0].text).toContain('```json')
    })

    it('should find site-settings global with select', async () => {
      await payload.updateGlobal({
        slug: 'site-settings',
        data: {
          contactEmail: 'test@example.com',
          maintenanceMode: false,
          siteDescription: 'Should be excluded by select',
          siteName: 'MCP Site',
        },
      })

      const apiKey = await getApiKey(false, false, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findSiteSettings',
            arguments: {
              select: '{"siteName": true}',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toBeDefined()
      expect(json.result.content[0].type).toBe('text')
      const responseText: string = json.result.content[0].text
      expect(responseText).toContain('"siteName":"MCP Site"')
      expect(responseText).not.toContain('siteDescription')
      expect(responseText).not.toContain('contactEmail')
      expect(responseText).not.toContain('maintenanceMode')
    })

    it('should update site-settings global', async () => {
      const apiKey = await getApiKey(false, false, true, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updateSiteSettings',
            arguments: {
              maintenanceMode: false,
              siteDescription: 'A test site for MCP global operations',
              siteName: 'MCP Test Site',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toBeDefined()
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain('Global "site-settings" updated successfully')
    })

    it('should update site-settings global with select', async () => {
      const apiKey = await getApiKey(false, false, true, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updateSiteSettings',
            arguments: {
              maintenanceMode: false,
              select: '{"siteName": true}',
              siteDescription: 'Should not appear',
              siteName: 'MCP Test Site Select',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toBeDefined()
      expect(json.result.content[0].type).toBe('text')
      const responseText: string = json.result.content[0].text
      expect(responseText).toContain('"siteName":"MCP Test Site Select"')
      expect(responseText).not.toContain('siteDescription')
      expect(responseText).not.toContain('maintenanceMode')
      expect(responseText).not.toContain('contactEmail')
    })
  })

  describe('Minified JSON responses', () => {
    it('should return minified JSON without newlines or indentation in resource responses', async () => {
      await payload.create({
        collection: 'posts',
        data: {
          title: 'Minified JSON Test',
          content: 'Content for minified test.',
        },
      })

      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findPosts',
            arguments: {
              limit: 1,
              page: 1,
              where: '{"title": {"equals": "Minified JSON Test"}}',
            },
          },
        }),
      })

      const json = await parseStreamResponse(response)

      const responseText: string = json.result.content[0].text
      const jsonBlocks = responseText.match(/```json\n[\s\S]*?```/g)

      expect(jsonBlocks).toBeTruthy()
      for (const block of jsonBlocks!) {
        const jsonContent = block.replace(/```json\n/, '').replace(/\n```/, '')
        // Minified JSON should be a single line with no indentation
        expect(jsonContent).not.toMatch(/\n\s+/)
        // Should be valid JSON
        expect(() => JSON.parse(jsonContent)).not.toThrow()
      }
    })

    it('should return minified JSON in global responses', async () => {
      const apiKey = await getApiKey(false, false, true)
      const response = await restClient.POST('/mcp', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findSiteSettings',
            arguments: {},
          },
        }),
      })

      const json = await parseStreamResponse(response)

      const responseText: string = json.result.content[0].text
      const jsonBlocks = responseText.match(/```json\n[\s\S]*?```/g)

      expect(jsonBlocks).toBeTruthy()
      for (const block of jsonBlocks!) {
        const jsonContent = block.replace(/```json\n/, '').replace(/\n```/, '')
        expect(jsonContent).not.toMatch(/\n\s+/)
        expect(() => JSON.parse(jsonContent)).not.toThrow()
      }
    })
  })

  describe('Localization', () => {
    it('should include locale parameters in tool schemas', async () => {
      const apiKey = await getApiKey(true, true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result.tools).toBeDefined()

      // Check createPosts has locale parameters
      const createTool = json.result.tools.find((t: any) => t.name === 'createPosts')
      expect(createTool).toBeDefined()
      expect(createTool.inputSchema.properties.locale).toBeDefined()
      expect(createTool.inputSchema.properties.locale.type).toBe('string')
      expect(createTool.inputSchema.properties.locale.description).toContain('locale code')
      expect(createTool.inputSchema.properties.fallbackLocale).toBeDefined()

      // Check updatePosts has locale parameters
      const updateTool = json.result.tools.find((t: any) => t.name === 'updatePosts')
      expect(updateTool).toBeDefined()
      expect(updateTool.inputSchema.properties.locale).toBeDefined()
      expect(updateTool.inputSchema.properties.fallbackLocale).toBeDefined()

      // Check findPosts has locale parameters
      const findTool = json.result.tools.find((t: any) => t.name === 'findPosts')
      expect(findTool).toBeDefined()
      expect(findTool.inputSchema.properties.locale).toBeDefined()
      expect(findTool.inputSchema.properties.fallbackLocale).toBeDefined()

      // Check deletePosts has locale parameters
      const deleteTool = json.result.tools.find((t: any) => t.name === 'deletePosts')
      expect(deleteTool).toBeDefined()
      expect(deleteTool.inputSchema.properties.locale).toBeDefined()
      expect(deleteTool.inputSchema.properties.fallbackLocale).toBeDefined()
    })

    it('should create post with specific locale', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'createPosts',
            arguments: {
              content: 'This is my first post in English',
              locale: 'en',
              title: 'Hello World',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain('Resource created successfully')
      expect(json.result.content[0].text).toContain('"title":"Hello World"')
      expect(json.result.content[0].text).toContain('"content":"This is my first post in English"')
    })

    it('should update post to add translation', async () => {
      // First create a post in English
      const englishPost = await payload.create({
        collection: 'posts',
        data: {
          content: 'English Content',
          title: 'English Title',
        },
      })

      // Update with Spanish translation via MCP
      const apiKey = await getApiKey(true)
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'updatePosts',
            arguments: {
              id: englishPost.id,
              content: 'Contenido Español',
              locale: 'es',
              title: 'Título Español',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain('Document updated successfully')
      expect(json.result.content[0].text).toContain('"title":"Título Español"')
      expect(json.result.content[0].text).toContain('"content":"Contenido Español"')
    })

    it('should find post in specific locale', async () => {
      // Create a post with English and Spanish translations
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'English Content',
          title: 'English Post',
        },
      })

      await payload.update({
        id: post.id,
        collection: 'posts',
        data: {
          content: 'Contenido Español',
          title: 'Publicación Española',
        },
        locale: 'es',
      })

      // Find in Spanish via MCP
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findPosts',
            arguments: {
              id: post.id,
              locale: 'es',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain(
        '"title":"Publicación Española (MCP Hook Override)"',
      )
      expect(json.result.content[0].text).toContain('"content":"Contenido Español"')
    })

    it('should find post with locale "all"', async () => {
      // Create a post with multiple translations
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'English Content',
          title: 'English Title',
        },
      })

      await payload.update({
        id: post.id,
        collection: 'posts',
        data: {
          content: 'Contenido Español',
          title: 'Título Español',
        },
        locale: 'es',
      })

      await payload.update({
        id: post.id,
        collection: 'posts',
        data: {
          content: 'Contenu Français',
          title: 'Titre Français',
        },
        locale: 'fr',
      })

      // Find with locale: all via MCP
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findPosts',
            arguments: {
              id: post.id,
              locale: 'all',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      const responseText = json.result.content[0].text

      // Should contain locale objects with all translations
      expect(responseText).toContain('"en":')
      expect(responseText).toContain('"es":')
      expect(responseText).toContain('"fr":')
      expect(responseText).toContain('English Title (MCP Hook Override)')
      expect(responseText).toContain('Título Español (MCP Hook Override)')
      expect(responseText).toContain('Titre Français (MCP Hook Override)')
    })

    it('should use fallback locale when translation does not exist', async () => {
      // Create a post only in English with explicit content
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'English Only Title',
        },
        locale: 'en',
      })

      // Try to find in French (which doesn't exist)
      const apiKey = await getApiKey()
      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'findPosts',
            arguments: {
              id: post.id,
              locale: 'fr',
            },
          },
        }),
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await parseStreamResponse(response)

      expect(json).toBeDefined()
      expect(json.result).toBeDefined()
      expect(json.result.content).toBeDefined()
      expect(json.result.content[0].type).toBe('text')
      // Should fallback to English (with default value for content)
      expect(json.result.content[0].text).toContain(
        '"title":"English Only Title (MCP Hook Override)"',
      )
      expect(json.result.content[0].text).toContain('"content":"Hello World."')
    })
  })
})
