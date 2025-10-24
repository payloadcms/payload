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

const getApiKey = async (enableUpdate = false, enableDelete = false): Promise<string> => {
  const doc = await payload.create({
    collection: 'payload-mcp-api-keys',
    data: {
      enableAPIKey: true,
      label: 'Test API Key',
      posts: { find: true, create: true, update: enableUpdate, delete: enableDelete },
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

  describe('Localization', () => {
    it('should include locale parameters in tool schemas', async () => {
      const apiKey = await getApiKey(true, true)
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
              title: 'Hello World',
              content: 'This is my first post in English',
              locale: 'en',
            },
          },
        }),
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain('Resource created successfully')
      expect(json.result.content[0].text).toContain('"title": "Title Override: Hello World"')
      expect(json.result.content[0].text).toContain('"content": "This is my first post in English"')
    })

    it('should update post to add translation', async () => {
      // First create a post in English
      const englishPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'English Title',
          content: 'English Content',
        },
      })

      // Update with Spanish translation via MCP
      const apiKey = await getApiKey(true)
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
            name: 'updatePosts',
            arguments: {
              id: englishPost.id,
              title: 'Título Español',
              content: 'Contenido Español',
              locale: 'es',
            },
          },
        }),
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain('Document updated successfully')
      expect(json.result.content[0].text).toContain('"title": "Title Override: Título Español"')
      expect(json.result.content[0].text).toContain('"content": "Contenido Español"')
    })

    it('should find post in specific locale', async () => {
      // Create a post with English and Spanish translations
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'English Post',
          content: 'English Content',
        },
      })

      await payload.update({
        id: post.id,
        collection: 'posts',
        data: {
          title: 'Publicación Española',
          content: 'Contenido Español',
        },
        locale: 'es',
      })

      // Find in Spanish via MCP
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
              id: post.id,
              locale: 'es',
            },
          },
        }),
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      expect(json.result.content[0].text).toContain('"title": "Publicación Española"')
      expect(json.result.content[0].text).toContain('"content": "Contenido Español"')
    })

    it('should find post with locale "all"', async () => {
      // Create a post with multiple translations
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'English Title',
          content: 'English Content',
        },
      })

      await payload.update({
        id: post.id,
        collection: 'posts',
        data: {
          title: 'Título Español',
          content: 'Contenido Español',
        },
        locale: 'es',
      })

      await payload.update({
        id: post.id,
        collection: 'posts',
        data: {
          title: 'Titre Français',
          content: 'Contenu Français',
        },
        locale: 'fr',
      })

      // Find with locale: all via MCP
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
              id: post.id,
              locale: 'all',
            },
          },
        }),
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      const responseText = json.result.content[0].text

      // Should contain locale objects with all translations
      expect(responseText).toContain('"en":')
      expect(responseText).toContain('"es":')
      expect(responseText).toContain('"fr":')
      expect(responseText).toContain('English Title')
      expect(responseText).toContain('Título Español')
      expect(responseText).toContain('Titre Français')
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
              id: post.id,
              locale: 'fr',
            },
          },
        }),
      })

      const json = await parseStreamResponse(response)

      expect(json.result).toBeDefined()
      // Should fallback to English (with default value for content)
      expect(json.result.content[0].text).toContain('"title": "English Only Title"')
      expect(json.result.content[0].text).toContain('"content": "Hello World."')
    })
  })
})
