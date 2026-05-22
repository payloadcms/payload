import type { Payload } from 'payload'

import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'

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

function extractJsonBlock(text: string): any {
  const match = text.match(/```json\n([\s\S]*?)\n```/)
  expect(match).toBeDefined()
  return JSON.parse(match![1]!)
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
      access: {
        collections: {
          posts: { create: true, delete: enableDelete, find: true, update: enableUpdate },
          products: { find: true },
        },
        ...(globalFind || globalUpdate
          ? {
              globals: {
                'site-settings': { find: globalFind, update: globalUpdate },
              },
            }
          : {}),
      },
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

  describe('API Keyed Access', () => {
    it('should create an API Key', async () => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          apiKey: randomUUID(),
          enableAPIKey: true,
          label: 'Test API Key',
          access: {
            collections: {
              posts: { create: true, find: true },
              products: { find: false },
            },
          },
          user: userId,
        },
      })

      expect(doc).toBeDefined()
      expect(doc.user).toBeDefined()
      // @ts-expect-error - doc.user is a string | User
      expect(doc.user?.id).toBe(userId)
      expect(doc.label).toBe('Test API Key')
      // @ts-expect-error - access is a JSON field
      expect(doc.access?.collections?.posts?.find).toBe(true)
      // @ts-expect-error - access is a JSON field
      expect(doc.access?.collections?.posts?.create).toBe(true)
      // @ts-expect-error - access is a JSON field
      expect(doc.access?.collections?.products?.find).toBe(false)
      expect(typeof doc.apiKey).toBe('string')
      expect(doc.apiKey).toHaveLength(36)
      expect(doc.override).toBe('This field added by overrideApiKeyCollection')
    })

    it('should not allow GET /api/mcp', async () => {
      const apiKey = await getApiKey()
      const response = await restClient.GET(`/mcp`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      // The MCP endpoint is registered as POST only; a GET should not succeed.
      expect(response.ok).toBe(false)
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
      expect(Array.isArray(json.result.tools)).toBe(true)
      expect(json.result.tools.length).toBeGreaterThan(0)

      const toolsByName: Record<string, any> = Object.fromEntries(
        json.result.tools.map((t: { name: string }) => [t.name, t]),
      )

      // findProducts: built-in find (no override) — uses default description
      const findProducts = toolsByName['findProducts']
      expect(findProducts).toBeDefined()
      expect(findProducts.description).toContain(
        'Find documents in a collection by ID or where clause using Find or FindByID.',
      )

      // createPosts: posts collection has its own description, no per-tool override
      const createPosts = toolsByName['createPosts']
      expect(createPosts).toBeDefined()
      expect(createPosts.description).toContain('This is a Payload collection with Post documents.')

      // findPosts: posts collection has a per-tool override on find
      const findPosts = toolsByName['findPosts']
      expect(findPosts).toBeDefined()
      expect(findPosts.description).toContain('Find blog posts')

      // diceRoll: custom top-level tool
      const diceRoll = toolsByName['diceRoll']
      expect(diceRoll).toBeDefined()
      expect(diceRoll.description).toContain(
        'Rolls a virtual dice with a specified number of sides',
      )

      // Input Schemas — find tool (top-level metadata fields)
      expect(findProducts.inputSchema).toBeDefined()
      expect(findProducts.inputSchema.required).not.toBeDefined()
      expect(findProducts.inputSchema.type).toBe('object')
      expect(findProducts.inputSchema.properties).toBeDefined()
      expect(findProducts.inputSchema.properties.id).toBeDefined()
      expect(findProducts.inputSchema.properties.id.description).toContain(
        'Optional: specific document ID to retrieve. If not provided, returns all documents',
      )
      expect(findProducts.inputSchema.properties.fallbackLocale).toBeDefined()
      expect(findProducts.inputSchema.properties.fallbackLocale.type).toBe('string')
      expect(findProducts.inputSchema.properties.limit).toBeDefined()
      expect(findProducts.inputSchema.properties.limit.type).toBe('integer')
      expect(findProducts.inputSchema.properties.limit.minimum).toBe(1)
      expect(findProducts.inputSchema.properties.limit.maximum).toBe(100)
      expect(findProducts.inputSchema.properties.limit.default).toBe(10)
      expect(findProducts.inputSchema.properties.locale).toBeDefined()
      expect(findProducts.inputSchema.properties.locale.type).toBe('string')
      expect(findProducts.inputSchema.properties.page).toBeDefined()
      expect(findProducts.inputSchema.properties.page.type).toBe('integer')
      expect(findProducts.inputSchema.properties.page.minimum).toBe(1)
      expect(findProducts.inputSchema.properties.page.default).toBe(1)
      expect(findProducts.inputSchema.properties.sort).toBeDefined()
      expect(findProducts.inputSchema.properties.sort.type).toBe('string')
      expect(findProducts.inputSchema.properties.where).toBeDefined()
      expect(findProducts.inputSchema.properties.where.type).toBe('string')

      // Create tool: `data` wraps the collection fields, metadata fields stay top-level
      expect(createPosts.inputSchema).toBeDefined()
      expect(createPosts.inputSchema.type).toBe('object')
      expect(createPosts.inputSchema.properties).toBeDefined()
      expect(createPosts.inputSchema.required).toBeDefined()
      expect(createPosts.inputSchema.required).toContain('data')

      // Collection fields live inside `data.properties`
      expect(createPosts.inputSchema.properties.data).toBeDefined()
      expect(createPosts.inputSchema.properties.data.type).toBe('object')
      const createDataProps = createPosts.inputSchema.properties.data.properties
      expect(createDataProps).toBeDefined()
      expect(createDataProps.title).toBeDefined()
      expect(createDataProps.content).toBeDefined()
      expect(createDataProps.author).toBeDefined()

      // Top-level metadata fields on create tool
      expect(createPosts.inputSchema.properties.draft).toBeDefined()
      expect(createPosts.inputSchema.properties.draft.type).toBe('boolean')
      expect(createPosts.inputSchema.properties.fallbackLocale).toBeDefined()
      expect(createPosts.inputSchema.properties.locale).toBeDefined()
      expect(createPosts.inputSchema.properties.select).toBeDefined()

      // Find tool: no `data` wrapper, just metadata fields
      expect(findPosts.inputSchema).toBeDefined()
      expect(findPosts.inputSchema.type).toBe('object')
      expect(findPosts.inputSchema.properties).toBeDefined()
      expect(findPosts.inputSchema.properties.id).toBeDefined()
      expect(findPosts.inputSchema.properties.limit).toBeDefined()
      expect(findPosts.inputSchema.properties.page).toBeDefined()
      expect(findPosts.inputSchema.properties.select).toBeDefined()
      expect(findPosts.inputSchema.properties.where).toBeDefined()

      // Custom top-level tool schema
      expect(diceRoll.inputSchema).toBeDefined()
      expect(diceRoll.inputSchema.type).toBe('object')
      expect(diceRoll.inputSchema.properties).toBeDefined()
      expect(diceRoll.inputSchema.properties.sides).toBeDefined()
      expect(diceRoll.inputSchema.properties.sides.minimum).toBe(2)
      expect(diceRoll.inputSchema.properties.sides.maximum).toBe(1000)
    })

    it('should list tools injected by other plugins via slug and options', async () => {
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
      const toolNames = json.result.tools.map((t: { name: string }) => t.name)

      // Both plugins inject tools into mcp's options via slug discovery,
      // regardless of whether they are listed before or after mcp in the plugins array
      expect(toolNames).toContain('injectedBefore')
      expect(toolNames).toContain('injectedAfter')
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

      // The global's description (from plugin config) overrides the built-in tool description
      const findGlobalTool = json.result.tools.find((t: any) => t.name === 'findSiteSettings')
      expect(findGlobalTool).toBeDefined()
      expect(findGlobalTool.description).toContain('Site-wide configuration settings.')
      expect(findGlobalTool.inputSchema.properties.select).toBeDefined()
      expect(findGlobalTool.inputSchema.properties.select.type).toBe('string')
      expect(findGlobalTool.inputSchema.properties.select.description).toContain(
        "Optional: define exactly which fields you'd like to return in the response (JSON), e.g., '{\"title\": true}'",
      )

      const updateGlobalTool = json.result.tools.find((t: any) => t.name === 'updateSiteSettings')
      expect(updateGlobalTool).toBeDefined()
      expect(updateGlobalTool.description).toContain('Site-wide configuration settings.')
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
    it('createPosts data validation: ensure invalid data is rejected', async () => {
      const apiKey = await getApiKey()

      const response = await restClient.POST('/mcp', {
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'createPosts',
            arguments: {
              data: {
                content: 'test content',
                title: 'test title',
                badProperty: 'not in schema',
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
      const validationRejected =
        json.error !== undefined ||
        json.result?.isError === true ||
        (typeof json.result?.content?.[0]?.text === 'string' &&
          json.result.content[0].text
            .toLowerCase()
            .includes('input validation error: invalid arguments for tool createposts'))
      expect(validationRejected).toBe(true)
    })

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
              data: {
                content: 'Content for test post.',
                title: 'Test Post',
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
      expect(json.result.content[0].text).toContain(
        'Document created successfully in collection "posts"!',
      )
      expect(json.result.content[0].text).toContain('Created document:')
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
              data: {
                content: 'Content should be omitted',
                title: 'Select Create Post',
              },
              select: '{"title": true}',
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
              data: {
                content: 'Updated content for test post to update.',
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
              data: {
                content: null,
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
              data: {
                author: userId,
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
      expect(json.result.content[0].type).toBe('text')
      expect(json.result.content[0].text).toContain(
        'Document updated successfully in collection "posts"!',
      )

      const updatedDoc = extractJsonBlock(json.result.content[0].text)
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
              data: {
                content: 'Updated but should be omitted',
                title: 'Select Update Post Edited',
              },
              select: '{"title": true}',
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
              data: {
                content: 'Testing point field transformation',
                location: {
                  latitude: 40.7128,
                  longitude: -74.006,
                },
                title: 'Post with Location',
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
      expect(json.result.content[0].text).toContain('Document created successfully')

      const createdDoc = extractJsonBlock(json.result.content[0].text)

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
              data: {
                location: {
                  latitude: 51.5074,
                  longitude: -0.1278,
                },
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

      const updatedDoc = extractJsonBlock(json.result.content[0].text)

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
          access: {
            collections: {
              pages: { create: true, delete: true, find: true, update: enableUpdate },
              posts: { create: false, find: false },
              products: { find: false },
            },
          },
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
              data: {
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

      createdPageIds.push(extractJsonBlock(json.result.content[0].text).id)
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
              data: {
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

      createdPageIds.push(extractJsonBlock(json.result.content[0].text).id)
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
              data: {
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
      expect(createTool.inputSchema.properties.data).toBeDefined()
      expect(createTool.inputSchema.properties.data.properties.computedTitle).toBeUndefined()
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
      expect(updateTool.inputSchema.properties.data).toBeDefined()
      expect(updateTool.inputSchema.properties.data.properties.computedTitle).toBeUndefined()
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
              data: {
                title: 'Virtual Field Create Test',
                content: 'Testing virtual field exclusion on create',
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

      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain(
        'Document created successfully in collection "posts"!',
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
              data: {
                title: 'Virtual Field Updated Title',
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
              data: {
                maintenanceMode: false,
                siteDescription: 'A test site for MCP global operations',
                siteName: 'MCP Test Site',
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
              data: {
                maintenanceMode: false,
                siteDescription: 'Should not appear',
                siteName: 'MCP Test Site Select',
              },
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
      expect(responseText).toContain('"siteName":"MCP Test Site Select"')
      expect(responseText).not.toContain('siteDescription')
      expect(responseText).not.toContain('maintenanceMode')
      expect(responseText).not.toContain('contactEmail')
    })
  })

  describe('Minified JSON responses', () => {
    const createdIDs: string[] = []

    afterEach(async () => {
      for (const id of createdIDs) {
        await payload.delete({ collection: 'posts', id })
      }
      createdIDs.length = 0
    })

    it('should return minified JSON without newlines or indentation in resource responses', async () => {
      const doc = await payload.create({
        collection: 'posts',
        data: {
          title: 'Minified JSON Test',
          content: 'Content for minified test.',
        },
      })

      createdIDs.push(doc.id)

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

    it('should return minified JSON in findByID resource responses', async () => {
      const doc = await payload.create({
        collection: 'posts',
        data: {
          title: 'Minified JSON FindByID Test',
          content: 'Content for findByID minified test.',
        },
      })

      createdIDs.push(doc.id)

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
              id: doc.id,
            },
          },
        }),
      })

      const json = await parseStreamResponse(response)

      const responseText: string = json.result.content[0].text
      // findByID response format: `Resource from collection "posts":\n${JSON.stringify(doc)}`
      // (no fenced code block — extract the JSON from the second line)
      const jsonPart = responseText.split('\n').slice(1).join('\n')

      expect(jsonPart).toBeTruthy()
      expect(() => JSON.parse(jsonPart)).not.toThrow()
      // Minified JSON should be a single line with no newlines
      expect(jsonPart).not.toContain('\n')
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
              data: {
                content: 'This is my first post in English',
                title: 'Hello World',
              },
              locale: 'en',
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
      expect(json.result.content[0].text).toContain('Document created successfully')
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
              data: {
                content: 'Contenido Español',
                title: 'Título Español',
              },
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

  describe('Field Types', () => {
    const createdFieldTypeIds: (number | string)[] = []

    const getFieldTypesApiKey = async (enableUpdate = false, enableDelete = false) => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          enableAPIKey: true,
          label: 'Field Types API Key',
          access: {
            collections: {
              'field-types': {
                create: true,
                delete: enableDelete,
                find: true,
                update: enableUpdate,
              },
            },
          },
          apiKey: randomUUID(),
          user: userId,
        },
      })
      return doc.apiKey as string
    }

    describe('Schema validation', () => {
      it('should not include ui field in create tool schema', async () => {
        const apiKey = await getFieldTypesApiKey()
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
        const createTool = json.result.tools.find((t: any) => t.name === 'createFieldTypes')
        expect(createTool).toBeDefined()

        const inputProps = createTool.inputSchema.properties.data.properties
        expect(inputProps).not.toHaveProperty('uiField')
      })

      it('should include group field as nested object in create tool schema', async () => {
        const apiKey = await getFieldTypesApiKey()
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
        const createTool = json.result.tools.find((t: any) => t.name === 'createFieldTypes')
        const inputProps = createTool.inputSchema.properties.data.properties

        expect(inputProps.groupField).toBeDefined()
        expect(inputProps.groupField.type).toBe('object')
        expect(inputProps.groupField.properties).toBeDefined()
        expect(inputProps.groupField.properties.groupText).toBeDefined()
        expect(inputProps.groupField.properties.groupNumber).toBeDefined()
      })

      it('should include collapsible children as top-level fields in create tool schema', async () => {
        const apiKey = await getFieldTypesApiKey()
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
        const createTool = json.result.tools.find((t: any) => t.name === 'createFieldTypes')
        const inputProps = createTool.inputSchema.properties.data.properties

        // Children of collapsible appear at the top level, not under a `collapsible` key
        expect(inputProps.collapsibleText).toBeDefined()
        // Nullable text fields render as anyOf: [string, null]
        expect(inputProps.collapsibleText.anyOf).toBeDefined()
        expect(inputProps.collapsibleText.anyOf.some((t: any) => t.type === 'string')).toBe(true)
      })

      it('should include row children as top-level fields in create tool schema', async () => {
        const apiKey = await getFieldTypesApiKey()
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
        const createTool = json.result.tools.find((t: any) => t.name === 'createFieldTypes')
        const inputProps = createTool.inputSchema.properties.data.properties

        // Children of row appear at the top level, not under a `row` key
        expect(inputProps.rowText).toBeDefined()
        expect(inputProps.rowText.anyOf).toBeDefined()
        expect(inputProps.rowText.anyOf.some((t: any) => t.type === 'string')).toBe(true)
      })

      it('should include named tab as nested object and unnamed tab children at top level in create tool schema', async () => {
        const apiKey = await getFieldTypesApiKey()
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
        const createTool = json.result.tools.find((t: any) => t.name === 'createFieldTypes')
        const inputProps = createTool.inputSchema.properties.data.properties

        // Named tab appears as a nested object
        expect(inputProps.namedTab).toBeDefined()
        expect(inputProps.namedTab.type).toBe('object')
        expect(inputProps.namedTab.properties).toBeDefined()
        expect(inputProps.namedTab.properties.namedTabText).toBeDefined()

        // Unnamed tab children appear at the top level
        expect(inputProps.unnamedTabText).toBeDefined()
        expect(inputProps.unnamedTabText.anyOf).toBeDefined()
        expect(inputProps.unnamedTabText.anyOf.some((t: any) => t.type === 'string')).toBe(true)
      })

      it('should include select field with enum values in create tool schema', async () => {
        const apiKey = await getFieldTypesApiKey()
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
        const createTool = json.result.tools.find((t: any) => t.name === 'createFieldTypes')
        const inputProps = createTool.inputSchema.properties.data.properties

        expect(inputProps.selectField).toBeDefined()
        expect(inputProps.selectField.enum).toBeDefined()
        expect(inputProps.selectField.enum).toContain('option1')
        expect(inputProps.selectField.enum).toContain('option2')
        expect(inputProps.selectField.enum).toContain('option3')
      })

      it('should include radio field with enum values in create tool schema', async () => {
        const apiKey = await getFieldTypesApiKey()
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
        const createTool = json.result.tools.find((t: any) => t.name === 'createFieldTypes')
        const inputProps = createTool.inputSchema.properties.data.properties

        expect(inputProps.radioField).toBeDefined()
        expect(inputProps.radioField.enum).toBeDefined()
        expect(inputProps.radioField.enum).toContain('radio1')
        expect(inputProps.radioField.enum).toContain('radio2')
        expect(inputProps.radioField.enum).toContain('radio3')
      })

      it('should include array field with item schema in create tool schema', async () => {
        const apiKey = await getFieldTypesApiKey()
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
        const createTool = json.result.tools.find((t: any) => t.name === 'createFieldTypes')
        const inputProps = createTool.inputSchema.properties.data.properties

        expect(inputProps.arrayField).toBeDefined()
        expect(inputProps.arrayField.type).toContain('array')
        expect(inputProps.arrayField.items).toBeDefined()
        expect(inputProps.arrayField.items.properties).toBeDefined()
        expect(inputProps.arrayField.items.properties.item).toBeDefined()
        expect(inputProps.arrayField.items.properties.itemNumber).toBeDefined()
      })
    })

    describe('Create + round-trip', () => {
      it('should create and find document with atomic data fields (text, textarea, number, email, checkbox)', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'Hello MCP',
                  textareaField: 'Multi-line\ntext content',
                  numberField: 42,
                  emailField: 'test@example.com',
                  checkboxField: true,
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()
        expect(json.result.content[0].type).toBe('text')
        expect(json.result.content[0].text).toContain(
          'Document created successfully in collection "field-types"!',
        )

        const doc = extractJsonBlock(json.result.content[0].text)

        expect(doc.textField).toBe('Hello MCP')
        expect(doc.textareaField).toBe('Multi-line\ntext content')
        expect(doc.numberField).toBe(42)
        expect(doc.emailField).toBe('test@example.com')
        expect(doc.checkboxField).toBe(true)

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with date, code, and json fields', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const testDate = '2024-01-15T10:30:00.000Z'
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'Date/Code/JSON test',
                  dateField: testDate,
                  codeField: 'const x = 42;',
                  jsonField: { key: 'value', nested: { count: 1 } },
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        expect(doc.codeField).toBe('const x = 42;')
        expect(doc.jsonField).toMatchObject({ key: 'value', nested: { count: 1 } })
        expect(doc.dateField).toBeDefined()

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with select field', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'Select test',
                  selectField: 'option2',
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        expect(doc.selectField).toBe('option2')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with radio field', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'Radio test',
                  radioField: 'radio3',
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        expect(doc.radioField).toBe('radio3')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with group field (nested object)', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'Group test',
                  groupField: {
                    groupText: 'Inside the group',
                    groupNumber: 99,
                  },
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        expect(doc.groupField).toBeDefined()
        expect(doc.groupField.groupText).toBe('Inside the group')
        expect(doc.groupField.groupNumber).toBe(99)

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with collapsible children at top level', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'Collapsible test',
                  collapsibleText: 'Text inside collapsible',
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        // collapsibleText is stored at the top level of the document
        expect(doc.collapsibleText).toBe('Text inside collapsible')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with row children at top level', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'Row test',
                  rowText: 'Text inside row',
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        // rowText is stored at the top level of the document
        expect(doc.rowText).toBe('Text inside row')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with tabs fields (named tab as object, unnamed tab children at top level)', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'Tabs test',
                  namedTab: {
                    namedTabText: 'Inside named tab',
                  },
                  unnamedTabText: 'Inside unnamed tab',
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        // Named tab stored as nested object
        expect(doc.namedTab).toBeDefined()
        expect(doc.namedTab.namedTabText).toBe('Inside named tab')

        // Unnamed tab child stored at document top level
        expect(doc.unnamedTabText).toBe('Inside unnamed tab')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with array field', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'Array test',
                  arrayField: [
                    { item: 'First item', itemNumber: 1 },
                    { item: 'Second item', itemNumber: 2 },
                  ],
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        expect(doc.arrayField).toHaveLength(2)
        expect(doc.arrayField[0].item).toBe('First item')
        expect(doc.arrayField[0].itemNumber).toBe(1)
        expect(doc.arrayField[1].item).toBe('Second item')
        expect(doc.arrayField[1].itemNumber).toBe(2)

        createdFieldTypeIds.push(doc.id)
      })

      it('should find documents in field-types collection', async () => {
        const created = await (payload as any).create({
          collection: 'field-types',
          data: { textField: 'Findable doc', numberField: 7 },
        })
        createdFieldTypeIds.push(created.id)

        const apiKey = await getFieldTypesApiKey()
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'findFieldTypes',
              arguments: {
                where: '{"textField": {"equals": "Findable doc"}}',
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
        expect(json.result.content[0].text).toContain('Collection: "field-types"')
        expect(json.result.content[0].text).toContain('"textField":"Findable doc"')
        expect(json.result.content[0].text).toContain('"numberField":7')
      })
    })

    describe('Update', () => {
      it('should update document with group field', async () => {
        const created = await (payload as any).create({
          collection: 'field-types',
          data: {
            textField: 'Group update test',
            groupField: { groupText: 'Original', groupNumber: 1 },
          },
        })
        createdFieldTypeIds.push(created.id)

        const apiKey = await getFieldTypesApiKey(true, false)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'updateFieldTypes',
              arguments: {
                id: created.id,
                data: {
                  groupField: {
                    groupText: 'Updated group text',
                    groupNumber: 100,
                  },
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()
        expect(json.result.content[0].text).toContain(
          'Document updated successfully in collection "field-types"!',
        )

        const doc = extractJsonBlock(json.result.content[0].text)

        expect(doc.groupField.groupText).toBe('Updated group text')
        expect(doc.groupField.groupNumber).toBe(100)
      })

      it('should update document with collapsible field (children at top level)', async () => {
        const created = await (payload as any).create({
          collection: 'field-types',
          data: {
            textField: 'Collapsible update test',
            collapsibleText: 'Original collapsible text',
          },
        })
        createdFieldTypeIds.push(created.id)

        const apiKey = await getFieldTypesApiKey(true, false)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'updateFieldTypes',
              arguments: {
                id: created.id,
                data: {
                  collapsibleText: 'Updated collapsible text',
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        expect(doc.collapsibleText).toBe('Updated collapsible text')
      })

      it('should update document with array field', async () => {
        const created = await (payload as any).create({
          collection: 'field-types',
          data: {
            textField: 'Array update test',
            arrayField: [{ item: 'Original item', itemNumber: 0 }],
          },
        })
        createdFieldTypeIds.push(created.id)

        const apiKey = await getFieldTypesApiKey(true, false)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'updateFieldTypes',
              arguments: {
                id: created.id,
                data: {
                  arrayField: [
                    { item: 'Updated item A', itemNumber: 10 },
                    { item: 'Updated item B', itemNumber: 20 },
                    { item: 'Updated item C', itemNumber: 30 },
                  ],
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        expect(doc.arrayField).toHaveLength(3)
        expect(doc.arrayField[0].item).toBe('Updated item A')
        expect(doc.arrayField[2].itemNumber).toBe(30)
      })
    })

    describe('Display field safety', () => {
      it('should create document with ui field present without errors and ui field absent from response', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)

        // Create a doc without passing any `uiField` value (it has no stored data)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'UI field safety test',
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()
        expect(json.result.content[0].text).toContain('Document created successfully')

        const doc = extractJsonBlock(json.result.content[0].text)

        // uiField has no stored data and should not appear in the document
        expect(doc).not.toHaveProperty('uiField')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create and find document with all structural layout fields populated', async () => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const response = await restClient.POST('/mcp', {
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'createFieldTypes',
              arguments: {
                data: {
                  textField: 'All layout fields test',
                  groupField: { groupText: 'Group value', groupNumber: 5 },
                  collapsibleText: 'Collapsible value',
                  rowText: 'Row value',
                  namedTab: { namedTabText: 'Named tab value' },
                  unnamedTabText: 'Unnamed tab value',
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

        expect(json.result).toBeDefined()
        expect(json.result.isError).toBeFalsy()

        const doc = extractJsonBlock(json.result.content[0].text)

        // All data fields are stored correctly regardless of their container type
        expect(doc.groupField.groupText).toBe('Group value')
        expect(doc.groupField.groupNumber).toBe(5)
        expect(doc.collapsibleText).toBe('Collapsible value')
        expect(doc.rowText).toBe('Row value')
        expect(doc.namedTab.namedTabText).toBe('Named tab value')
        expect(doc.unnamedTabText).toBe('Unnamed tab value')

        // UI field is never present in stored documents
        expect(doc).not.toHaveProperty('uiField')

        createdFieldTypeIds.push(doc.id)
      })
    })
  })
})
