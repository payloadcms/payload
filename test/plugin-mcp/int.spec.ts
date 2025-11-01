import type { Payload } from 'payload'

import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'

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
      posts: { find: true, create: true, update: enableUpdate, delete: enableDelete },
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

    token = data.token
    userId = data.user.id
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should create an API Key', async () => {
    const doc = await payload.create({
      collection: 'payload-mcp-api-keys',
      data: {
        enableAPIKey: true,
        label: 'Test API Key',
        posts: { find: true, create: true },
        apiKey: randomUUID(),
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
    expect(doc.custom?.diceRoll).toBe(true)
    expect(doc.products?.find).toBe(false)
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
    expect(data.jsonrpc).toBe('2.0')
    expect(data.error).toBeDefined()
    expect(data.error.code).toBe(-32000)
    expect(data.error.message).toBe('Method not allowed.')
  })

  it('should ping', async () => {
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
        method: 'ping',
        params: {},
      }),
    })

    const json = await parseStreamResponse(response)
    expect(json).toBeDefined()
  })

  it('should list tools', async () => {
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
        method: 'tools/list',
        params: {},
      }),
    })

    const json = await parseStreamResponse(response)

    expect(json).toBeDefined()
    expect(json.id).toBe(1)
    expect(json.jsonrpc).toBe('2.0')
    expect(json.result).toBeDefined()
    expect(json.result.tools).toBeDefined()
    expect(json.result.tools).toHaveLength(3)
    expect(json.result.tools[0].name).toBe('createPosts')
    expect(json.result.tools[0].description).toContain('Create a document in a Payload collection.')
    expect(json.result.tools[0].description).toContain(
      'This is a Payload collection with Post documents.',
    )
    expect(json.result.tools[0].inputSchema).toBeDefined()
    expect(json.result.tools[1].name).toBe('findPosts')
    expect(json.result.tools[1].description).toContain(
      'Find documents in a Payload collection using Find or FindByID.',
    )
    expect(json.result.tools[1].description).toContain(
      'This is a Payload collection with Post documents.',
    )
    expect(json.result.tools[1].inputSchema).toBeDefined()
    expect(json.result.tools[2].name).toBe('diceRoll')
    expect(json.result.tools[2].description).toContain(
      'Rolls a virtual dice with a specified number of sides',
    )
    expect(json.result.tools[2].inputSchema).toBeDefined()
  })

  it('should list resources', async () => {
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
        method: 'resources/list',
        params: {},
      }),
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
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'prompts/list',
        params: {},
      }),
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

  it('should call diceRoll', async () => {
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
          name: 'diceRoll',
          arguments: {
            sides: 6,
          },
        },
      }),
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
  })

  it('should call createPosts', async () => {
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
          name: 'createPosts',
          arguments: {
            title: 'Test Post',
            content: 'Content for test post.',
          },
        },
      }),
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
    expect(json.result.content[0].text).toContain('"title": "Title Override: Test Post"')
    expect(json.result.content[0].text).toContain('"content": "Content for test post."')
    expect(json.result.content[1].type).toBe('text')
    expect(json.result.content[1].text).toContain('Override MCP response for Posts!')
  })

  it('should call findPosts', async () => {
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Test Post for Finding',
        content: 'Content for test post.',
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
            where: '{"title": {"contains": "Test Post for Finding"}}',
          },
        },
      }),
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
    expect(json.result.content[0].text).toContain('"title": "Test Post for Finding"')
    expect(json.result.content[1].type).toBe('text')
    expect(json.result.content[1].text).toContain('Override MCP response for Posts!')
  })

  it('should find site-settings global', async () => {
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

    expect(json).toBeDefined()
    expect(json.result).toBeDefined()
    expect(json.result.content).toBeDefined()
    expect(json.result.content[0].type).toBe('text')
    expect(json.result.content[0].text).toContain('Global "site-settings"')
    expect(json.result.content[0].text).toContain('```json')
  })

  it('should update site-settings global', async () => {
    const apiKey = await getApiKey(false, false, true, true)
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
          name: 'updateSiteSettings',
          arguments: {
            siteName: 'MCP Test Site',
            siteDescription: 'A test site for MCP global operations',
            maintenanceMode: false,
          },
        },
      }),
    })

    const json = await parseStreamResponse(response)

    expect(json).toBeDefined()
    expect(json.result).toBeDefined()
    expect(json.result.content).toHaveLength(1)
    expect(json.result.content[0].type).toBe('text')
    expect(json.result.content[0].text).toContain('Global "site-settings" updated successfully')
    expect(json.result.content[0].text).toContain('MCP Test Site')
    expect(json.result.content[0].text).toContain('A test site for MCP global operations')
  })

  it('should include globals in tools list', async () => {
    const apiKey = await getApiKey(false, false, true, true)
    const response = await restClient.POST('/mcp', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
      }),
    })

    const json = await parseStreamResponse(response)

    expect(json).toBeDefined()
    expect(json.result).toBeDefined()
    expect(json.result.tools).toBeDefined()

    const findGlobalTool = json.result.tools.find((t: any) => t.name === 'findSiteSettings')
    expect(findGlobalTool).toBeDefined()
    expect(findGlobalTool.description).toContain('Payload global')

    const updateGlobalTool = json.result.tools.find((t: any) => t.name === 'updateSiteSettings')
    expect(updateGlobalTool).toBeDefined()
    expect(updateGlobalTool.description).toContain('Payload global')
  })
})
