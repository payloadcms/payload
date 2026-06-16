import { randomUUID } from 'crypto'
import { afterEach, describe, expect, vi } from 'vitest'

import { getToolDoc, getToolText } from './helpers/mcpClient.js'
import { getApiKey, it, payload, restClient, userId } from './helpers/mcpFixtures.js'

/**
 * Reports JSON Schema draft 2020-12 violations in a tool's `input_schema
 */
function draft2020Violations(schema: unknown, rootPath: string): string[] {
  const errors: string[] = []
  const walk = (node: any, jsonPath: string): void => {
    if (Array.isArray(node)) {
      node.forEach((child, index) => walk(child, `${jsonPath}/${index}`))
      return
    }
    if (!node || typeof node !== 'object') {
      return
    }
    if (typeof node.$schema === 'string' && !node.$schema.includes('2020-12')) {
      errors.push(`${jsonPath}: non-2020-12 $schema "${node.$schema}"`)
    }
    if ('definitions' in node) {
      errors.push(`${jsonPath}: draft-07 "definitions" (2020-12 uses "$defs")`)
    }
    if (typeof node.$ref === 'string' && node.$ref.startsWith('#/definitions/')) {
      errors.push(`${jsonPath}: $ref into draft-07 "definitions"`)
    }
    if (Array.isArray(node.required) && new Set(node.required).size !== node.required.length) {
      errors.push(`${jsonPath}: duplicate "required" entries [${node.required.join(', ')}]`)
    }
    if (
      Array.isArray(node.type) &&
      (node.type.length === 0 || new Set(node.type).size !== node.type.length)
    ) {
      errors.push(`${jsonPath}: invalid "type" array [${node.type.join(', ')}]`)
    }
    for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
      if (keyword in node && (!Array.isArray(node[keyword]) || node[keyword].length === 0)) {
        errors.push(`${jsonPath}: empty "${keyword}"`)
      }
    }
    for (const [key, value] of Object.entries(node)) {
      walk(value, `${jsonPath}/${key}`)
    }
  }
  walk(schema, rootPath)
  return errors
}

describe('@payloadcms/plugin-mcp', () => {
  it('should ping', async ({ mcp }) => {
    const apiKey = await getApiKey()
    const client = await mcp.connect(apiKey)
    const pingResponse = await client.ping()
    expect(pingResponse).toBeDefined()
  })

  describe('API Keyed Access', () => {
    it('should create an API Key', async () => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          apiKey: randomUUID(),
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

      // MCP is POST-only; the optional GET stream answers 405 (Method Not Allowed)
      // per the Streamable HTTP spec, so clients skip the server-push stream.
      expect(response.status).toBe(405)
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

    it('should update last used with a direct database write', async ({ mcp }) => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          apiKey: randomUUID(),
          label: 'Last Used API Key',
          user: userId,
        },
      })
      const beforeRequest = Date.now()
      const updateOneSpy = vi.spyOn(payload.db, 'updateOne')

      try {
        const client = await mcp.connect(doc.apiKey as string)
        await client.ping()

        expect(updateOneSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            collection: 'payload-mcp-api-keys',
            id: doc.id,
            returning: false,
          }),
        )

        const updatedDoc = await payload.findByID({
          id: doc.id,
          collection: 'payload-mcp-api-keys',
          depth: 0,
        })

        expect(updatedDoc.lastUsed).toBeDefined()
        expect(new Date(updatedDoc.lastUsed as string).getTime()).toBeGreaterThanOrEqual(
          beforeRequest,
        )
      } finally {
        updateOneSpy.mockRestore()
      }
    })
  })

  describe('List', () => {
    it('should list tools', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const toolsResponse = await client.listTools()
      expect(toolsResponse).toBeDefined()
      expect(toolsResponse.tools).toBeDefined()
      expect(Array.isArray(toolsResponse.tools)).toBe(true)
      expect(toolsResponse.tools.length).toBeGreaterThan(0)

      const toolsByName: Record<string, any> = Object.fromEntries(
        toolsResponse.tools.map((t: { name: string }) => [t.name, t]),
      )

      const getConfigInfo = toolsByName['getConfigInfo']
      expect(getConfigInfo).toBeDefined()
      expect(getConfigInfo.description).toContain('List the Payload collection and global slugs')

      const createDocument = toolsByName['createDocument']
      expect(createDocument).toBeDefined()
      expect(createDocument.description).toContain('Create a document in any collection')

      const findDocuments = toolsByName['findDocuments']
      expect(findDocuments).toBeDefined()
      expect(findDocuments.description).toContain('Find documents in any collection')

      // diceRoll: custom top-level tool
      const diceRoll = toolsByName['diceRoll']
      expect(diceRoll).toBeDefined()
      expect(diceRoll.description).toContain(
        'Rolls a virtual dice with a specified number of sides',
      )

      const createDocumentTools = toolsResponse.tools.filter(
        (tool: { name: string }) => tool.name === 'createDocument',
      )
      expect(createDocumentTools).toHaveLength(1)
      expect(toolsByName.createDocument).toBeDefined()
      expect(toolsByName.getCollectionSchema).toBeDefined()
      expect(toolsByName.createDocument.inputSchema.properties.collectionSlug).toBeDefined()
      expect(toolsByName.createDocument.inputSchema.properties.collectionSlug.type).toBe('string')
      expect(toolsByName.createDocument.inputSchema.properties.collectionSlug.enum).toBeUndefined()
      expect(toolsByName.createDocument.inputSchema.properties.collectionSlug.description).toBe(
        'The collection slug',
      )

      // Input Schemas — find tool (top-level metadata fields)
      expect(findDocuments.inputSchema).toBeDefined()
      expect(findDocuments.inputSchema.type).toBe('object')
      expect(findDocuments.inputSchema.properties).toBeDefined()
      expect(findDocuments.inputSchema.properties.collectionSlug).toBeDefined()
      expect(findDocuments.inputSchema.properties.collectionSlug.type).toBe('string')
      expect(findDocuments.inputSchema.properties.collectionSlug.enum).toBeUndefined()
      expect(findDocuments.inputSchema.properties.id).toBeDefined()
      expect(findDocuments.inputSchema.properties.id.description).toContain(
        'Optional: specific document ID to retrieve. If not provided, returns all documents',
      )
      expect(findDocuments.inputSchema.properties.fallbackLocale).toBeDefined()
      expect(findDocuments.inputSchema.properties.fallbackLocale.type).toBe('string')
      expect(findDocuments.inputSchema.properties.limit).toBeDefined()
      expect(findDocuments.inputSchema.properties.limit.type).toBe('integer')
      expect(findDocuments.inputSchema.properties.limit.minimum).toBe(1)
      expect(findDocuments.inputSchema.properties.limit.maximum).toBe(100)
      expect(findDocuments.inputSchema.properties.limit.default).toBe(10)
      expect(findDocuments.inputSchema.properties.locale).toBeDefined()
      expect(findDocuments.inputSchema.properties.locale.type).toBe('string')
      expect(findDocuments.inputSchema.properties.page).toBeDefined()
      expect(findDocuments.inputSchema.properties.page.type).toBe('integer')
      expect(findDocuments.inputSchema.properties.page.minimum).toBe(1)
      expect(findDocuments.inputSchema.properties.page.default).toBe(1)
      expect(findDocuments.inputSchema.properties.pagination).toBeDefined()
      expect(findDocuments.inputSchema.properties.pagination.type).toBe('boolean')
      expect(findDocuments.inputSchema.properties.populate).toBeDefined()
      expect(findDocuments.inputSchema.properties.populate.type).toBe('object')
      expect(findDocuments.inputSchema.properties.populate.description).toContain(
        'control which fields to include from populated relationship or upload documents',
      )
      expect(findDocuments.inputSchema.properties.joins).toBeDefined()
      expect(findDocuments.inputSchema.properties.joins.description).toContain(
        'configure join field queries',
      )
      expect(findDocuments.inputSchema.properties.sort).toBeDefined()
      expect(findDocuments.inputSchema.properties.sort.type).toBe('string')
      expect(findDocuments.inputSchema.properties.trash).toBeDefined()
      expect(findDocuments.inputSchema.properties.trash.type).toBe('boolean')
      expect(findDocuments.inputSchema.properties.where).toBeDefined()
      // Where clause is a $ref to a shared recursive schema: and/or groups plus field operators
      const whereRef: string = findDocuments.inputSchema.properties.where.$ref
      expect(whereRef).toMatch(/^#\/\$defs\//)
      const whereDef = findDocuments.inputSchema.$defs[whereRef.replace('#/$defs/', '')]
      expect(whereDef.type).toBe('object')
      expect(whereDef.properties.and.type).toBe('array')
      expect(whereDef.properties.or.type).toBe('array')
      expect(whereDef.additionalProperties.propertyNames.enum).toContain('equals')

      // Create tool: `data` wraps the collection fields, metadata fields stay top-level
      expect(createDocument.inputSchema).toBeDefined()
      expect(createDocument.inputSchema.type).toBe('object')
      expect(createDocument.inputSchema.properties).toBeDefined()
      expect(createDocument.inputSchema.required).toBeDefined()
      expect(createDocument.inputSchema.required).toContain('data')

      expect(createDocument.inputSchema.properties.data).toBeDefined()
      expect(createDocument.inputSchema.properties.data.type).toBe('object')

      // Top-level metadata fields on create tool
      expect(createDocument.inputSchema.properties.draft).toBeDefined()
      expect(createDocument.inputSchema.properties.draft.type).toBe('boolean')
      expect(createDocument.inputSchema.properties.fallbackLocale).toBeDefined()
      expect(createDocument.inputSchema.properties.locale).toBeDefined()
      expect(createDocument.inputSchema.properties.select).toBeDefined()
      expect(createDocument.inputSchema.properties.select.type).toBe('object')

      // Find tool: no `data` wrapper, just metadata fields
      expect(findDocuments.inputSchema).toBeDefined()
      expect(findDocuments.inputSchema.type).toBe('object')
      expect(findDocuments.inputSchema.properties).toBeDefined()
      expect(findDocuments.inputSchema.properties.id).toBeDefined()
      expect(findDocuments.inputSchema.properties.limit).toBeDefined()
      expect(findDocuments.inputSchema.properties.page).toBeDefined()
      expect(findDocuments.inputSchema.properties.select).toBeDefined()
      expect(findDocuments.inputSchema.properties.select.type).toBe('object')
      expect(findDocuments.inputSchema.properties.where).toBeDefined()

      // Custom top-level tool schema
      expect(diceRoll.inputSchema).toBeDefined()
      expect(diceRoll.inputSchema.type).toBe('object')
      expect(diceRoll.inputSchema.properties).toBeDefined()
      expect(diceRoll.inputSchema.properties.sides).toBeDefined()
      expect(diceRoll.inputSchema.properties.sides.minimum).toBe(2)
      expect(diceRoll.inputSchema.properties.sides.maximum).toBe(1000)
    })

    it('should return config info', async ({ mcp }) => {
      const apiKey = await getApiKey({ globalFind: true, globalUpdate: true })
      const client = await mcp.connect(apiKey)
      const response = await client.callTool({ arguments: {}, name: 'getConfigInfo' })
      const text = getToolText(response)

      expect(text).toContain('Collections:')
      expect(text).toContain('posts')
      expect(text).toContain('Globals:')
      expect(text).toContain('site-settings')
    })

    it('should return readable slugs even when scoped tools are disabled', async ({ mcp }) => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          access: {
            collections: {
              posts: {
                create: false,
                delete: false,
                find: false,
                getCollectionSchema: false,
                publish: false,
                update: false,
              },
            },
          },
          apiKey: randomUUID(),
          label: 'Readable Slugs',
          user: userId,
        },
      })

      const client = await mcp.connect(doc.apiKey as string)
      const response = await client.callTool({ arguments: {}, name: 'getConfigInfo' })
      const text = getToolText(response)

      expect(text).toContain('posts')
    })

    it('should hide config info when disabled for an API key', async ({ mcp }) => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          access: {
            tools: {
              getConfigInfo: false,
            },
          },
          apiKey: randomUUID(),
          label: 'No Config Info',
          user: userId,
        },
      })

      const client = await mcp.connect(doc.apiKey as string)
      const toolsResponse = await client.listTools()
      const toolNames = toolsResponse.tools.map((tool: { name: string }) => tool.name)

      expect(toolNames).not.toContain('getConfigInfo')
    })

    it('should expose only tool input schemas that are valid JSON Schema draft 2020-12', async ({
      mcp,
    }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const toolsResponse = await client.listTools()
      const tools = toolsResponse.tools as Array<{ inputSchema?: object; name: string }>

      // MCP clients validate each input_schema against the strict 2020-12 meta-schema. The SDK's own validator is
      // lenient (it only compiles), so lint for what the meta-schema enforces.
      const invalid = tools.flatMap((tool) =>
        tool.inputSchema ? draft2020Violations(tool.inputSchema, tool.name) : [],
      )

      expect(invalid).toEqual([])
    })

    it('should list tools injected by other plugins via slug and options', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const toolsResponse = await client.listTools()
      const toolNames = toolsResponse.tools.map((t: { name: string }) => t.name)

      // Both plugins inject tools into mcp's options via slug discovery,
      // regardless of whether they are listed before or after mcp in the plugins array
      expect(toolNames).toContain('injectedBefore')
      expect(toolNames).toContain('injectedAfter')
    })

    it('should list resources', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const resourcesResponse = await client.listResources()

      expect(resourcesResponse).toBeDefined()
      expect(resourcesResponse.resources).toBeDefined()
      expect(resourcesResponse.resources).toHaveLength(1)
      expect(resourcesResponse.resources[0].name).toBe('data')
      expect(resourcesResponse.resources[0].title).toBe('Data')
      expect(resourcesResponse.resources[0].uri).toBe('data://app')
      expect(resourcesResponse.resources[0].description).toBe(
        'Data is a resource that contains special data.',
      )
      expect(resourcesResponse.resources[0].mimeType).toBe('text/plain')
    })

    it('should list prompts', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const promptsResponse = await client.listPrompts()

      expect(promptsResponse).toBeDefined()
      expect(promptsResponse.prompts).toBeDefined()
      expect(promptsResponse.prompts).toHaveLength(1)
      expect(promptsResponse.prompts[0].name).toBe('echo')
      expect(promptsResponse.prompts[0].title).toBe('Echo Prompt')
      expect(promptsResponse.prompts[0].description).toBe('Creates a prompt to process a message')
      expect(promptsResponse.prompts[0].arguments).toBeDefined()
      expect(promptsResponse.prompts[0].arguments).toHaveLength(1)
      expect(promptsResponse.prompts[0].arguments[0].name).toBe('message')
      expect(promptsResponse.prompts[0].arguments[0].required).toBe(true)
    })

    it('should list globals', async ({ mcp }) => {
      const apiKey = await getApiKey({ globalFind: true, globalUpdate: true })
      const client = await mcp.connect(apiKey)
      const toolsResponse = await client.listTools()

      expect(toolsResponse).toBeDefined()
      expect(toolsResponse.tools).toBeDefined()

      const findGlobalTool = toolsResponse.tools.find((t: any) => t.name === 'findGlobal')
      expect(findGlobalTool).toBeDefined()
      expect(findGlobalTool.description).toContain('Find any Payload global')
      expect(findGlobalTool.inputSchema.properties.globalSlug.type).toBe('string')
      expect(findGlobalTool.inputSchema.properties.globalSlug.enum).toBeUndefined()
      expect(findGlobalTool.inputSchema.properties.globalSlug.description).toBe('The global slug')
      expect(findGlobalTool.inputSchema.properties.select).toBeDefined()
      expect(findGlobalTool.inputSchema.properties.select.type).toBe('object')
      expect(findGlobalTool.inputSchema.properties.select.description).toContain(
        "Optional: define exactly which fields you'd like to return in the response",
      )
      expect(findGlobalTool.inputSchema.properties.populate).toBeDefined()
      expect(findGlobalTool.inputSchema.properties.populate.type).toBe('object')
      expect(findGlobalTool.inputSchema.properties.populate.description).toContain(
        'control which fields to include from populated relationship or upload documents',
      )

      const updateGlobalTool = toolsResponse.tools.find((t: any) => t.name === 'updateGlobal')
      expect(updateGlobalTool).toBeDefined()
      expect(updateGlobalTool.description).toContain('Update any Payload global')
      expect(updateGlobalTool.inputSchema.properties.globalSlug.type).toBe('string')
      expect(updateGlobalTool.inputSchema.properties.globalSlug.enum).toBeUndefined()
      expect(updateGlobalTool.inputSchema.properties.globalSlug.description).toBe('The global slug')
      expect(updateGlobalTool.inputSchema.properties.select).toBeDefined()
      expect(updateGlobalTool.inputSchema.properties.select.type).toBe('object')
      expect(updateGlobalTool.inputSchema.properties.select.description).toContain(
        "Optional: define exactly which fields you'd like to return in the response",
      )
    })

    it('should list updateDocument when API key permits update and include select schema', async ({
      mcp,
    }) => {
      const apiKey = await getApiKey({ enableUpdate: true })
      const client = await mcp.connect(apiKey)
      const toolsResponse = await client.listTools()

      const updateToolSchema = toolsResponse.tools.find((t: any) => t.name === 'updateDocument')
      expect(updateToolSchema).toBeDefined()
      expect(updateToolSchema.inputSchema.properties.select).toBeDefined()
      expect(updateToolSchema.inputSchema.properties.select.type).toBe('object')
      expect(updateToolSchema.inputSchema.properties.select.description).toContain(
        "Optional: define exactly which fields you'd like to return in the response",
      )
    })
  })

  describe('Prompts', () => {
    it('should get echo prompt', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const promptResponse = await client.getPrompt({
        name: 'echo',
        arguments: {
          message: 'Hello, world!',
        },
      })

      expect(promptResponse).toBeDefined()
      expect(promptResponse.messages).toHaveLength(2)
      expect(promptResponse.messages[0].content.type).toBe('text')
      expect(promptResponse.messages[0].content.text).toContain('This prompt was sent: Hello, world!')
      expect(promptResponse.messages[1].content.type).toBe('text')
      expect(promptResponse.messages[1].content.text).toContain(
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
    it('should read the data resource', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const resourceResponse = await client.readResource({
        uri: 'data://app',
      })

      expect(resourceResponse).toBeDefined()
      expect(resourceResponse.contents).toHaveLength(2)
      expect(resourceResponse.contents[0].uri).toBe('data://app')
      expect(resourceResponse.contents[0].text).toContain('My special data.')
      expect(resourceResponse.contents[1].text).toContain(`This was requested by user: ${userId}`)

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

    it('should read the dataByID resource', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const resourceResponse = await client.readResource({
        uri: 'data://app/1',
      })

      expect(resourceResponse).toBeDefined()
      expect(resourceResponse.contents).toHaveLength(2)
      expect(resourceResponse.contents[0].uri).toBe('data://app/1')
      expect(resourceResponse.contents[0].text).toContain('My special data for ID: 1')
      expect(resourceResponse.contents[1].text).toContain(`This was requested by user: ${userId}`)

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
    it('should call diceRoll', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          globalSlug: 'site-settings',
          collectionSlug: 'posts',
          sides: 6,
        },
        name: 'diceRoll',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toHaveLength(1)
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain('**Sides:** 6')
      expect(callResponse.content[0].text).toContain('**Result:**')
      expect(callResponse.content[0].text).toContain('🎲 You rolled a **')
      expect(callResponse.content[0].text).toContain('** on a 6-sided die!')

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
    it('getCollectionSchema returns collection fields for createDocument', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const schemaResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
        },
        name: 'getCollectionSchema',
      })
      const schema = getToolDoc<any>(schemaResponse)

      expect(schema.properties.title).toBeDefined()
      expect(schema.properties.content).toBeDefined()
      expect(schema.properties.badProperty).toBeUndefined()
    })

    it('should call createDocument', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          data: {
            content: 'Content for test post.',
            title: 'Test Post',
          },
        },
        name: 'createDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toHaveLength(2)
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain(
        'Document created successfully in collection "posts"!',
      )
      expect(callResponse.content[0].text).toContain('Created document:')
      expect(callResponse.content[0].text).toContain('```json')
      expect(callResponse.content[0].text).toContain('"title":"Test Post"')
      expect(callResponse.content[0].text).toContain('"content":"Content for test post."')
      expect(callResponse.content[1].type).toBe('text')
      expect(callResponse.content[1].text).toContain('Override MCP response for Posts!')
    })

    it('should call createDocument with select to limit returned fields', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          data: {
            content: 'Content should be omitted',
            title: 'Select Create Post',
          },
          select: { title: true },
        },
        name: 'createDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content[0].text).toContain('"title":"Select Create Post"')
      expect(callResponse.content[0].text).not.toContain('Content should be omitted')
    })

    it('should call getCollectionSchema', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
        },
        name: 'getCollectionSchema',
      })

      expect(callResponse.content[0].text).toContain('Schema for collection "posts"')
      expect(callResponse.content[0].text).toContain('"title"')
      expect(callResponse.content[0].text).toContain('"content"')
    })

    it('should call createDocument', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          data: {
            content: 'Content for generic create.',
            title: 'Generic Create Post',
          },
        },
        name: 'createDocument',
      })

      expect(callResponse.content[0].text).toContain(
        'Document created successfully in collection "posts"!',
      )
      expect(callResponse.content[0].text).toContain('"title":"Generic Create Post"')
      expect(callResponse.content[1].text).toContain('Override MCP response for Posts!')
    })

    it('should respect per-collection access for createDocument', async ({ mcp }) => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          access: {
            collections: {
              posts: { create: false },
            },
          },
          apiKey: randomUUID(),
          label: 'Denied Create Document Key',
          user: userId,
        },
      })

      const client = await mcp.connect(doc.apiKey as string)
      const toolsResponse = await client.listTools()
      const createDocument = toolsResponse.tools.find((tool) => tool.name === 'createDocument')
      expect(createDocument.inputSchema.properties.collectionSlug.type).toBe('string')
      expect(createDocument.inputSchema.properties.collectionSlug.enum).toBeUndefined()

      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          data: {
            content: 'Should not be created',
            title: 'Denied Generic Create',
          },
        },
        name: 'createDocument',
      })

      expect((callResponse as any).isError).toBe(true)
      expect(callResponse.content[0].text).toContain(
        'MCP access to "createDocument" is not enabled for collection "posts"',
      )
    })

    it('should call findDocuments', async ({ mcp }) => {
      await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for test post.',
          title: 'Test Post for Finding',
        },
      })

      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          limit: 1,
          page: 1,
          where: { title: { contains: 'Test Post for Finding' } },
        },
        name: 'findDocuments',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toHaveLength(2)
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain('Collection: "posts"')
      expect(callResponse.content[0].text).toContain('Total: 1 documents')
      expect(callResponse.content[0].text).toContain('Page: 1 of 1')
      expect(callResponse.content[0].text).toContain('```json')
      expect(callResponse.content[0].text).toContain('"content":"Content for test post."')
      expect(callResponse.content[1].type).toBe('text')
      expect(callResponse.content[1].text).toContain('Override MCP response for Posts!')
    })

    it('should call findDocuments with select and return only requested fields', async ({
      mcp,
    }) => {
      await payload.create({
        collection: 'posts',
        data: {
          content: 'Content that should be omitted',
          title: 'Select Test Post',
        },
      })

      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          limit: 1,
          page: 1,
          select: { title: true },
          where: { title: { contains: 'Select Test Post' } },
        },
        name: 'findDocuments',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toHaveLength(2)
      const responseText: string = callResponse.content[0].text
      expect(responseText).toContain('Collection: "posts"')
      expect(responseText).toContain('"title":"Select Test Post (MCP Hook Override)"')
      expect(responseText).not.toContain('"content": "Content that should be omitted"')
    })

    it('should pass populate, joins, trash, and pagination to findDocuments list queries', async ({
      mcp,
    }) => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          author: userId,
          content: 'Find options pass-through content',
          title: 'Find Options Pass Through',
        },
      })
      const apiKey = await getApiKey()
      const findSpy = vi.spyOn(payload, 'find')

      try {
        const callResponse = await mcp.callTool({
          apiKey,
          args: {
            collectionSlug: 'posts',
            joins: false,
            limit: 1,
            page: 1,
            pagination: false,
            populate: { users: { email: true } },
            trash: true,
            where: { title: { equals: 'Find Options Pass Through' } },
          },
          name: 'findDocuments',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.result).toBeDefined()
        expect(findSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            collection: 'posts',
            joins: false,
            pagination: false,
            populate: { users: { email: true } },
            trash: true,
          }),
        )
      } finally {
        findSpy.mockRestore()
        await payload.delete({ id: post.id, collection: 'posts' })
      }
    })

    it('should pass populate, joins, and trash to findDocuments ID queries', async ({ mcp }) => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          author: userId,
          content: 'Find by ID options pass-through content',
          title: 'Find By ID Options Pass Through',
        },
      })
      const apiKey = await getApiKey()
      const findByIDSpy = vi.spyOn(payload, 'findByID')

      try {
        const callResponse = await mcp.callTool({
          apiKey,
          args: {
            collectionSlug: 'posts',
            id: post.id,
            joins: false,
            populate: { users: { email: true } },
            trash: true,
          },
          name: 'findDocuments',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.result).toBeDefined()
        expect(findByIDSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            collection: 'posts',
            id: post.id,
            joins: false,
            populate: { users: { email: true } },
            trash: true,
          }),
        )
      } finally {
        findByIDSpy.mockRestore()
        await payload.delete({ id: post.id, collection: 'posts' })
      }
    })

    it('should call updateDocument', async ({ mcp }) => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for test post to update.',
          title: 'Test Post for Updating',
        },
      })

      const apiKey = await getApiKey({ enableUpdate: true, enableDelete: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: post.id,
          data: {
            content: 'Updated content for test post to update.',
          },
        },
        name: 'updateDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toHaveLength(2)
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain(
        'Document updated successfully in collection "posts"!',
      )
      expect(callResponse.content[0].text).toContain('Updated document:')
      expect(callResponse.content[0].text).toContain('```json')
      expect(callResponse.content[0].text).toContain(
        '"content":"Updated content for test post to update."',
      )
    })

    it('should call updateDocument with nullable union type field set to null', async ({ mcp }) => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'Content to be cleared',
          title: 'Union Type Null Test',
        },
      })

      const apiKey = await getApiKey({ enableUpdate: true, enableDelete: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: post.id,
          data: {
            content: null,
          },
        },
        name: 'updateDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain(
        'Document updated successfully in collection "posts"!',
      )
      expect(callResponse.content[0].text).toContain('"content":null')

      await payload.delete({ id: post.id, collection: 'posts' })
    })

    it('should call updateDocument with relationship union type field', async ({ mcp }) => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'Union Type Relationship Test',
        },
      })

      const apiKey = await getApiKey({ enableUpdate: true, enableDelete: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: post.id,
          data: {
            author: userId,
          },
        },
        name: 'updateDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain(
        'Document updated successfully in collection "posts"!',
      )

      const updatedDoc = getToolDoc(callResponse)
      expect(updatedDoc.author).toBe(userId)

      await payload.delete({ id: post.id, collection: 'posts' })
    })

    it('should call updateDocument with select to limit returned fields', async ({ mcp }) => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'Original content',
          title: 'Select Update Post',
        },
      })

      const apiKey = await getApiKey({ enableUpdate: true, enableDelete: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: post.id,
          data: {
            content: 'Updated but should be omitted',
            title: 'Select Update Post Edited',
          },
          select: { title: true },
        },
        name: 'updateDocument',
      })

      expect(callResponse).toBeDefined()
      const responseText: string = callResponse.content[0].text
      expect(responseText).toContain('"title":"Select Update Post Edited"')
      expect(responseText).not.toContain('Updated but should be omitted')
      expect(responseText).not.toContain('"content":')
    })

    it('should call deleteDocuments', async ({ mcp }) => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for test post to delete.',
          title: 'Test Post for Deleting',
        },
      })

      const apiKey = await getApiKey({ enableDelete: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: post.id,
        },
        name: 'deleteDocuments',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toHaveLength(2)
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain(
        'Document deleted successfully from collection "posts"!',
      )
      expect(callResponse.content[0].text).toContain('Deleted document:')
      expect(callResponse.content[0].text).toContain('```json')
      expect(callResponse.content[0].text).toContain('"content":"Content for test post to delete."')
    })

    it('should call updateDocument with object where clause', async ({ mcp }) => {
      const matching = await payload.create({
        collection: 'posts',
        data: {
          content: 'Original content',
          title: 'Where Object Update Match',
        },
      })
      const excluded = await payload.create({
        collection: 'posts',
        data: {
          content: 'Original content',
          title: 'Where Object Update Excluded',
        },
      })

      const apiKey = await getApiKey({ enableUpdate: true, enableDelete: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          data: {
            content: 'Updated by object where',
          },
          where: {
            and: [
              { title: { like: 'Where Object Update' } },
              { title: { not_equals: 'Where Object Update Excluded' } },
            ],
          },
        },
        name: 'updateDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain('Updated: 1 documents')
      expect(callResponse.content[0].text).toContain('"content":"Updated by object where"')

      const untouched = await payload.findByID({ id: excluded.id, collection: 'posts' })

      expect(untouched.content).toBe('Original content')

      await payload.delete({ id: matching.id, collection: 'posts' })
      await payload.delete({ id: excluded.id, collection: 'posts' })
    })

    it('should call deleteDocuments with object where clause', async ({ mcp }) => {
      await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for object where delete.',
          title: 'Where Object Delete One',
        },
      })
      await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for object where delete.',
          title: 'Where Object Delete Two',
        },
      })

      const apiKey = await getApiKey({ enableDelete: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          where: {
            or: [
              { title: { equals: 'Where Object Delete One' } },
              { title: { equals: 'Where Object Delete Two' } },
            ],
          },
        },
        name: 'deleteDocuments',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain('Deleted: 2 documents')
      expect(callResponse.content[0].text).toContain('Errors: 0')
    })

    it('should reject a where clause with an invalid operator', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          where: { title: { equalz: 'whatever' } },
        },
        name: 'findDocuments',
      })

      // The SDK surfaces schema validation failures as tool error results
      expect(callResponse.isError).toBe(true)
      expect(callResponse.content[0].text).toContain('Input validation error')
      expect(callResponse.content[0].text).toContain('equalz')
    })

    it('should handle point fields with object format in createDocument', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          data: {
            content: 'Testing point field transformation',
            location: {
              latitude: 40.7128,
              longitude: -74.006,
            },
            title: 'Post with Location',
          },
        },
        name: 'createDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toHaveLength(2)
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain('Document created successfully')

      const createdDoc = getToolDoc(callResponse)

      expect(createdDoc.location).toEqual([-74.006, 40.7128])

      expect(callResponse.content[1].type).toBe('text')
      expect(callResponse.content[1].text).toContain('Override MCP response for Posts!')

      await payload.delete({ id: createdDoc.id, collection: 'posts' })
    })

    it('should handle point fields with object format in updateDocument', async ({ mcp }) => {
      const apiKey = await getApiKey({ enableUpdate: true })
      const client = await mcp.connect(apiKey)

      const createdPost = await payload.create({
        collection: 'posts',
        data: {
          location: [-118.2437, 34.0522],
          title: 'Post to Update Location',
        },
      })

      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: createdPost.id,
          data: {
            location: {
              latitude: 51.5074,
              longitude: -0.1278,
            },
          },
        },
        name: 'updateDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toHaveLength(2)
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain('Document updated successfully')

      const updatedDoc = getToolDoc(callResponse)

      expect(updatedDoc.location).toEqual([-0.1278, 51.5074])

      expect(callResponse.content[1].type).toBe('text')
      expect(callResponse.content[1].text).toContain('Override MCP response for Posts!')

      await payload.delete({ id: createdPost.id, collection: 'posts' })
    })
  })

  describe('Blocks fields', () => {
    const createdPageIds: (number | string)[] = []

    const getPagesApiKey = async (enableUpdate = false) => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
          label: 'Pages API Key',
          access: {
            collections: {
              pages: {
                create: true,
                delete: true,
                find: true,
                update: enableUpdate,
              },
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

    it('should create a page with a block', async ({ mcp }) => {
      const apiKey = await getPagesApiKey()
      const client = await mcp.connect(apiKey)

      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'pages',
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
        name: 'createDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.isError).toBeFalsy()
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain('"title":"Hero Page"')
      expect(callResponse.content[0].text).toContain('"blockType":"hero"')
      expect(callResponse.content[0].text).toContain('"heading":"Welcome to our site"')

      createdPageIds.push(getToolDoc(callResponse).id)
    })

    it('should create a page with multiple block types', async ({ mcp }) => {
      const apiKey = await getPagesApiKey()
      const client = await mcp.connect(apiKey)

      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'pages',
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
        name: 'createDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.isError).toBeFalsy()
      expect(callResponse.content[0].text).toContain('"blockType":"hero"')
      expect(callResponse.content[0].text).toContain('"blockType":"textContent"')
      expect(callResponse.content[0].text).toContain('"heading":"Page Hero"')
      expect(callResponse.content[0].text).toContain('"body":"This is the body text."')

      createdPageIds.push(getToolDoc(callResponse).id)
    })

    it('should update a page layout that contains blocks', async ({ mcp }) => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'Page to Update',
          layout: [],
        },
      })

      createdPageIds.push(page.id)

      const apiKey = await getPagesApiKey(true)
      const client = await mcp.connect(apiKey)

      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'pages',
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
        name: 'updateDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.isError).toBeFalsy()
      expect(callResponse.content[0].text).toContain('"blockType":"hero"')
      expect(callResponse.content[0].text).toContain('"heading":"Updated Hero Heading"')
      expect(callResponse.content[0].text).toContain('"blockType":"textContent"')
      expect(callResponse.content[0].text).toContain('"body":"Updated body text."')

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
    it('should not include virtual fields in collection schema', async ({ mcp }) => {
      const apiKey = await getApiKey({ enableUpdate: true })
      const client = await mcp.connect(apiKey)
      const schemaResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
        },
        name: 'getCollectionSchema',
      })
      const schema = getToolDoc<any>(schemaResponse)

      expect(schema.properties.computedTitle).toBeUndefined()
    })

    it('should ignore virtual fields when creating a post via MCP', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          data: {
            title: 'Virtual Field Create Test',
            content: 'Testing virtual field exclusion on create',
          },
        },
        name: 'createDocument',
      })

      const text = getToolText(callResponse)
      expect(text).toContain('Document created successfully in collection "posts"!')
      expect(text).toContain('"title":"Virtual Field Create Test"')
      expect(text).not.toContain('"computedTitle"')

      const { id: createdId } = getToolDoc<{ id: string }>(callResponse)
      if (createdId) {
        await payload.delete({ id: createdId, collection: 'posts' })
      }
    })

    it('should ignore virtual fields when updating a post via MCP', async ({ mcp }) => {
      const post = await payload.create({
        collection: 'posts',
        data: { title: 'Virtual Field Update Test' },
      })

      const apiKey = await getApiKey({ enableUpdate: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: post.id,
          data: { title: 'Virtual Field Updated Title' },
        },
        name: 'updateDocument',
      })

      const text = getToolText(callResponse)
      expect(text).toContain('Document updated successfully')
      expect(text).toContain('"title":"Virtual Field Updated Title"')
      expect(text).not.toContain('"computedTitle"')

      await payload.delete({ id: post.id, collection: 'posts' })
    })
  })

  describe('payloadAPI context', () => {
    it('should call operations with the payloadAPI context as MCP', async ({ mcp }) => {
      await payload.create({
        collection: 'posts',
        data: {
          content: 'Content for test post.',
          title: 'Test Post for Finding',
        },
      })

      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          limit: 1,
          page: 1,
          where: { title: { contains: 'Test Post for Finding' } },
        },
        name: 'findDocuments',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toHaveLength(2)
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain(
        '"title":"Test Post for Finding (MCP Hook Override)"',
      )
    })

    it('should find site-settings global', async ({ mcp }) => {
      const apiKey = await getApiKey({ globalFind: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: { globalSlug: 'site-settings' },
        name: 'findGlobal',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toBeDefined()
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain('Global "site-settings"')
      expect(callResponse.content[0].text).toContain('```json')
    })

    it('should find site-settings global with select', async ({ mcp }) => {
      await payload.updateGlobal({
        slug: 'site-settings',
        data: {
          contactEmail: 'test@example.com',
          maintenanceMode: false,
          siteDescription: 'Should be excluded by select',
          siteName: 'MCP Site',
        },
      })

      const apiKey = await getApiKey({ globalFind: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          globalSlug: 'site-settings',
          collectionSlug: 'posts',
          select: { siteName: true },
        },
        name: 'findGlobal',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toBeDefined()
      expect(callResponse.content[0].type).toBe('text')
      const responseText: string = callResponse.content[0].text
      expect(responseText).toContain('"siteName":"MCP Site"')
      expect(responseText).not.toContain('siteDescription')
      expect(responseText).not.toContain('contactEmail')
      expect(responseText).not.toContain('maintenanceMode')
    })

    it('should pass populate to findGlobal', async ({ mcp }) => {
      const apiKey = await getApiKey({ globalFind: true })
      const findGlobalSpy = vi.spyOn(payload, 'findGlobal')

      try {
        const callResponse = await mcp.callTool({
          apiKey,
          args: {
            globalSlug: 'site-settings',
            populate: { users: { email: true } },
          },
          name: 'findGlobal',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.result).toBeDefined()
        expect(findGlobalSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            populate: { users: { email: true } },
            slug: 'site-settings',
          }),
        )
      } finally {
        findGlobalSpy.mockRestore()
      }
    })

    it('should update site-settings global', async ({ mcp }) => {
      const apiKey = await getApiKey({ globalFind: true, globalUpdate: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          globalSlug: 'site-settings',
          data: {
            maintenanceMode: false,
            siteDescription: 'A test site for MCP global operations',
            siteName: 'MCP Test Site',
          },
        },
        name: 'updateGlobal',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toBeDefined()
      expect(callResponse.content[0].type).toBe('text')
      expect(callResponse.content[0].text).toContain('Global "site-settings" updated successfully')
    })

    it('should update site-settings global with select', async ({ mcp }) => {
      const apiKey = await getApiKey({ globalFind: true, globalUpdate: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          globalSlug: 'site-settings',
          data: {
            maintenanceMode: false,
            siteDescription: 'Should not appear',
            siteName: 'MCP Test Site Select',
          },
          select: { siteName: true },
        },
        name: 'updateGlobal',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content).toBeDefined()
      expect(callResponse.content[0].type).toBe('text')
      const responseText: string = callResponse.content[0].text
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

    it('should return minified JSON without newlines or indentation in resource responses', async ({
      mcp,
    }) => {
      const doc = await payload.create({
        collection: 'posts',
        data: {
          title: 'Minified JSON Test',
          content: 'Content for minified test.',
        },
      })

      createdIDs.push(doc.id)

      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          limit: 1,
          page: 1,
          where: { title: { equals: 'Minified JSON Test' } },
        },
        name: 'findDocuments',
      })

      const responseText: string = callResponse.content[0].text
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

    it('should return minified JSON in global responses', async ({ mcp }) => {
      const apiKey = await getApiKey({ globalFind: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: { globalSlug: 'site-settings' },
        name: 'findGlobal',
      })

      const responseText: string = callResponse.content[0].text
      const jsonBlocks = responseText.match(/```json\n[\s\S]*?```/g)

      expect(jsonBlocks).toBeTruthy()
      for (const block of jsonBlocks!) {
        const jsonContent = block.replace(/```json\n/, '').replace(/\n```/, '')
        expect(jsonContent).not.toMatch(/\n\s+/)
        expect(() => JSON.parse(jsonContent)).not.toThrow()
      }
    })

    it('should return minified JSON in findByID resource responses', async ({ mcp }) => {
      const doc = await payload.create({
        collection: 'posts',
        data: {
          title: 'Minified JSON FindByID Test',
          content: 'Content for findByID minified test.',
        },
      })

      createdIDs.push(doc.id)

      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: doc.id,
        },
        name: 'findDocuments',
      })

      const responseText: string = callResponse.content[0].text
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
    it('should include locale parameters in tool schemas', async ({ mcp }) => {
      const apiKey = await getApiKey({ enableUpdate: true, enableDelete: true })
      const client = await mcp.connect(apiKey)
      const toolsResponse = await client.listTools()

      expect(toolsResponse.tools).toBeDefined()

      // Check createDocument has locale parameters
      const createTool = toolsResponse.tools.find((t: any) => t.name === 'createDocument')
      expect(createTool).toBeDefined()
      expect(createTool.inputSchema.properties.locale).toBeDefined()
      expect(createTool.inputSchema.properties.locale.type).toBe('string')
      expect(createTool.inputSchema.properties.locale.description).toContain('locale code')
      expect(createTool.inputSchema.properties.fallbackLocale).toBeDefined()

      // Check updateDocument has locale parameters
      const updateTool = toolsResponse.tools.find((t: any) => t.name === 'updateDocument')
      expect(updateTool).toBeDefined()
      expect(updateTool.inputSchema.properties.locale).toBeDefined()
      expect(updateTool.inputSchema.properties.fallbackLocale).toBeDefined()

      // Check findDocuments has locale parameters
      const findTool = toolsResponse.tools.find((t: any) => t.name === 'findDocuments')
      expect(findTool).toBeDefined()
      expect(findTool.inputSchema.properties.locale).toBeDefined()
      expect(findTool.inputSchema.properties.fallbackLocale).toBeDefined()

      // Check deleteDocuments has locale parameters
      const deleteTool = toolsResponse.tools.find((t: any) => t.name === 'deleteDocuments')
      expect(deleteTool).toBeDefined()
      expect(deleteTool.inputSchema.properties.locale).toBeDefined()
      expect(deleteTool.inputSchema.properties.fallbackLocale).toBeDefined()
    })

    it('should create post with specific locale', async ({ mcp }) => {
      const apiKey = await getApiKey()
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          data: {
            content: 'This is my first post in English',
            title: 'Hello World',
          },
          locale: 'en',
        },
        name: 'createDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content[0].text).toContain('Document created successfully')
      expect(callResponse.content[0].text).toContain('"title":"Hello World"')
      expect(callResponse.content[0].text).toContain('"content":"This is my first post in English"')
    })

    it('should update post to add translation', async ({ mcp }) => {
      // First create a post in English
      const englishPost = await payload.create({
        collection: 'posts',
        data: {
          content: 'English Content',
          title: 'English Title',
        },
      })

      // Update with Spanish translation via MCP
      const apiKey = await getApiKey({ enableUpdate: true })
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: englishPost.id,
          data: {
            content: 'Contenido Español',
            title: 'Título Español',
          },
          locale: 'es',
        },
        name: 'updateDocument',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content[0].text).toContain('Document updated successfully')
      expect(callResponse.content[0].text).toContain('"title":"Título Español"')
      expect(callResponse.content[0].text).toContain('"content":"Contenido Español"')
    })

    it('should find post in specific locale', async ({ mcp }) => {
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
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: post.id,
          locale: 'es',
        },
        name: 'findDocuments',
      })

      expect(callResponse).toBeDefined()
      expect(callResponse.content[0].text).toContain(
        '"title":"Publicación Española (MCP Hook Override)"',
      )
      expect(callResponse.content[0].text).toContain('"content":"Contenido Español"')
    })

    it('should find post with locale "all"', async ({ mcp }) => {
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
      const client = await mcp.connect(apiKey)
      const callResponse = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: post.id,
          locale: 'all',
        },
        name: 'findDocuments',
      })

      expect(callResponse).toBeDefined()
      const responseText = callResponse.content[0].text

      // Should contain locale objects with all translations
      expect(responseText).toContain('"en":')
      expect(responseText).toContain('"es":')
      expect(responseText).toContain('"fr":')
      expect(responseText).toContain('English Title (MCP Hook Override)')
      expect(responseText).toContain('Título Español (MCP Hook Override)')
      expect(responseText).toContain('Titre Français (MCP Hook Override)')
    })

    it('should use fallback locale when translation does not exist', async ({ mcp }) => {
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
      const client = await mcp.connect(apiKey)
      const json = await client.callTool({
        arguments: {
          collectionSlug: 'posts',
          id: post.id,
          locale: 'fr',
        },
        name: 'findDocuments',
      })

      expect(json).toBeDefined()
      expect(json.content).toBeDefined()
      expect(json.content[0].type).toBe('text')
      // Should fallback to English (with default value for content)
      expect(json.content[0].text).toContain('"title":"English Only Title (MCP Hook Override)"')
      expect(json.content[0].text).toContain('"content":"Hello World."')
    })
  })

  describe('Field Types', () => {
    const createdFieldTypeIds: (number | string)[] = []

    const getFieldTypesApiKey = async (enableUpdate = false, enableDelete = false) => {
      const doc = await payload.create({
        collection: 'payload-mcp-api-keys',
        data: {
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
      const getFieldTypeInputProps = async (mcp: any, apiKey: string) => {
        const client = await mcp.connect(apiKey)
        const schemaResponse = await client.callTool({
          arguments: { collectionSlug: 'field-types' },
          name: 'getCollectionSchema',
        })

        return getToolDoc<any>(schemaResponse).properties
      }

      it('should not include ui field in create tool schema', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey()
        const inputProps = await getFieldTypeInputProps(mcp, apiKey)

        expect(inputProps).not.toHaveProperty('uiField')
      })

      it('should include group field as nested object in create tool schema', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey()
        const inputProps = await getFieldTypeInputProps(mcp, apiKey)

        expect(inputProps.groupField).toBeDefined()
        expect(inputProps.groupField.type).toBe('object')
        expect(inputProps.groupField.properties).toBeDefined()
        expect(inputProps.groupField.properties.groupText).toBeDefined()
        expect(inputProps.groupField.properties.groupNumber).toBeDefined()
      })

      it('should include collapsible children as top-level fields in create tool schema', async ({
        mcp,
      }) => {
        const apiKey = await getFieldTypesApiKey()
        const inputProps = await getFieldTypeInputProps(mcp, apiKey)

        // Children of collapsible appear at the top level, not under a `collapsible` key
        expect(inputProps.collapsibleText).toBeDefined()
        // Nullable text fields render as a type array: ['string', 'null']
        expect(inputProps.collapsibleText.type).toContain('string')
        expect(inputProps.collapsibleText.type).toContain('null')
      })

      it('should include row children as top-level fields in create tool schema', async ({
        mcp,
      }) => {
        const apiKey = await getFieldTypesApiKey()
        const inputProps = await getFieldTypeInputProps(mcp, apiKey)

        // Children of row appear at the top level, not under a `row` key
        expect(inputProps.rowText).toBeDefined()
        expect(inputProps.rowText.type).toContain('string')
        expect(inputProps.rowText.type).toContain('null')
      })

      it('should include named tab as nested object and unnamed tab children at top level in create tool schema', async ({
        mcp,
      }) => {
        const apiKey = await getFieldTypesApiKey()
        const inputProps = await getFieldTypeInputProps(mcp, apiKey)

        // Named tab appears as a nested object
        expect(inputProps.namedTab).toBeDefined()
        expect(inputProps.namedTab.type).toBe('object')
        expect(inputProps.namedTab.properties).toBeDefined()
        expect(inputProps.namedTab.properties.namedTabText).toBeDefined()

        // Unnamed tab children appear at the top level
        expect(inputProps.unnamedTabText).toBeDefined()
        expect(inputProps.unnamedTabText.type).toContain('string')
        expect(inputProps.unnamedTabText.type).toContain('null')
      })

      it('should include select field with enum values in create tool schema', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey()
        const inputProps = await getFieldTypeInputProps(mcp, apiKey)

        expect(inputProps.selectField).toBeDefined()
        expect(inputProps.selectField.enum).toBeDefined()
        expect(inputProps.selectField.enum).toContain('option1')
        expect(inputProps.selectField.enum).toContain('option2')
        expect(inputProps.selectField.enum).toContain('option3')
      })

      it('should include radio field with enum values in create tool schema', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey()
        const inputProps = await getFieldTypeInputProps(mcp, apiKey)

        expect(inputProps.radioField).toBeDefined()
        expect(inputProps.radioField.enum).toBeDefined()
        expect(inputProps.radioField.enum).toContain('radio1')
        expect(inputProps.radioField.enum).toContain('radio2')
        expect(inputProps.radioField.enum).toContain('radio3')
      })

      it('should include array field with item schema in create tool schema', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey()
        const inputProps = await getFieldTypeInputProps(mcp, apiKey)

        expect(inputProps.arrayField).toBeDefined()
        expect(inputProps.arrayField.type).toContain('array')
        expect(inputProps.arrayField.items).toBeDefined()
        expect(inputProps.arrayField.items.properties).toBeDefined()
        expect(inputProps.arrayField.items.properties.item).toBeDefined()
        expect(inputProps.arrayField.items.properties.itemNumber).toBeDefined()
      })
    })

    describe('Create + round-trip', () => {
      it('should create and find document with atomic data fields (text, textarea, number, email, checkbox)', async ({
        mcp,
      }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'Hello MCP',
              textareaField: 'Multi-line\ntext content',
              numberField: 42,
              emailField: 'test@example.com',
              checkboxField: true,
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()
        expect(callResponse.content[0].type).toBe('text')
        expect(callResponse.content[0].text).toContain(
          'Document created successfully in collection "field-types"!',
        )

        const doc = getToolDoc(callResponse)

        expect(doc.textField).toBe('Hello MCP')
        expect(doc.textareaField).toBe('Multi-line\ntext content')
        expect(doc.numberField).toBe(42)
        expect(doc.emailField).toBe('test@example.com')
        expect(doc.checkboxField).toBe(true)

        createdFieldTypeIds.push(doc.id)
      })

      it('should return the collection schema when createDocument fails validation', async ({
        mcp,
      }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              numberField: 'not a number',
            },
          },
          name: 'createDocument',
        })

        expect(callResponse.isError).toBe(true)
        expect(callResponse.content[0].text).toContain('Use this schema for data')
        expect(callResponse.content[0].text).toContain('"numberField"')
        expect(
          (callResponse as any).structuredContent.schema.properties.numberField,
        ).toBeDefined()
      })

      it('should create document with date, code, and json fields', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const testDate = '2024-01-15T10:30:00.000Z'
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'Date/Code/JSON test',
              dateField: testDate,
              codeField: 'const x = 42;',
              jsonField: { key: 'value', nested: { count: 1 } },
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        expect(doc.codeField).toBe('const x = 42;')
        expect(doc.jsonField).toMatchObject({ key: 'value', nested: { count: 1 } })
        expect(doc.dateField).toBeDefined()

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with select field', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'Select test',
              selectField: 'option2',
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        expect(doc.selectField).toBe('option2')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with radio field', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'Radio test',
              radioField: 'radio3',
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        expect(doc.radioField).toBe('radio3')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with group field (nested object)', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'Group test',
              groupField: {
                groupText: 'Inside the group',
                groupNumber: 99,
              },
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        expect(doc.groupField).toBeDefined()
        expect(doc.groupField.groupText).toBe('Inside the group')
        expect(doc.groupField.groupNumber).toBe(99)

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with collapsible children at top level', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'Collapsible test',
              collapsibleText: 'Text inside collapsible',
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        // collapsibleText is stored at the top level of the document
        expect(doc.collapsibleText).toBe('Text inside collapsible')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with row children at top level', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'Row test',
              rowText: 'Text inside row',
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        // rowText is stored at the top level of the document
        expect(doc.rowText).toBe('Text inside row')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with tabs fields (named tab as object, unnamed tab children at top level)', async ({
        mcp,
      }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'Tabs test',
              namedTab: {
                namedTabText: 'Inside named tab',
              },
              unnamedTabText: 'Inside unnamed tab',
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        // Named tab stored as nested object
        expect(doc.namedTab).toBeDefined()
        expect(doc.namedTab.namedTabText).toBe('Inside named tab')

        // Unnamed tab child stored at document top level
        expect(doc.unnamedTabText).toBe('Inside unnamed tab')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create document with array field', async ({ mcp }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'Array test',
              arrayField: [
                { item: 'First item', itemNumber: 1 },
                { item: 'Second item', itemNumber: 2 },
              ],
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        expect(doc.arrayField).toHaveLength(2)
        expect(doc.arrayField[0].item).toBe('First item')
        expect(doc.arrayField[0].itemNumber).toBe(1)
        expect(doc.arrayField[1].item).toBe('Second item')
        expect(doc.arrayField[1].itemNumber).toBe(2)

        createdFieldTypeIds.push(doc.id)
      })

      it('should find documents in field-types collection', async ({ mcp }) => {
        const created = await (payload as any).create({
          collection: 'field-types',
          data: { textField: 'Findable doc', numberField: 7 },
        })
        createdFieldTypeIds.push(created.id)

        const apiKey = await getFieldTypesApiKey()
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            where: { textField: { equals: 'Findable doc' } },
          },
          name: 'findDocuments',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()
        expect(callResponse.content[0].text).toContain('Collection: "field-types"')
        expect(callResponse.content[0].text).toContain('"textField":"Findable doc"')
        expect(callResponse.content[0].text).toContain('"numberField":7')
      })
    })

    describe('Update', () => {
      it('should update document with group field', async ({ mcp }) => {
        const created = await (payload as any).create({
          collection: 'field-types',
          data: {
            textField: 'Group update test',
            groupField: { groupText: 'Original', groupNumber: 1 },
          },
        })
        createdFieldTypeIds.push(created.id)

        const apiKey = await getFieldTypesApiKey(true, false)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            id: created.id,
            data: {
              groupField: {
                groupText: 'Updated group text',
                groupNumber: 100,
              },
            },
          },
          name: 'updateDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()
        expect(callResponse.content[0].text).toContain(
          'Document updated successfully in collection "field-types"!',
        )

        const doc = getToolDoc(callResponse)

        expect(doc.groupField.groupText).toBe('Updated group text')
        expect(doc.groupField.groupNumber).toBe(100)
      })

      it('should return the collection schema when updateDocument fails validation', async ({
        mcp,
      }) => {
        const created = await (payload as any).create({
          collection: 'field-types',
          data: {
            numberField: 1,
            textField: 'Validation update test',
          },
        })
        createdFieldTypeIds.push(created.id)

        const apiKey = await getFieldTypesApiKey(true, false)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            id: created.id,
            data: {
              numberField: 'not a number',
            },
          },
          name: 'updateDocument',
        })

        expect(callResponse.isError).toBe(true)
        expect(callResponse.content[0].text).toContain('Use this schema for data')
        expect(callResponse.content[0].text).toContain('"numberField"')
        expect(
          (callResponse as any).structuredContent.schema.properties.numberField,
        ).toBeDefined()
      })

      it('should update document with collapsible field (children at top level)', async ({
        mcp,
      }) => {
        const created = await (payload as any).create({
          collection: 'field-types',
          data: {
            textField: 'Collapsible update test',
            collapsibleText: 'Original collapsible text',
          },
        })
        createdFieldTypeIds.push(created.id)

        const apiKey = await getFieldTypesApiKey(true, false)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            id: created.id,
            data: {
              collapsibleText: 'Updated collapsible text',
            },
          },
          name: 'updateDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        expect(doc.collapsibleText).toBe('Updated collapsible text')
      })

      it('should update document with array field', async ({ mcp }) => {
        const created = await (payload as any).create({
          collection: 'field-types',
          data: {
            textField: 'Array update test',
            arrayField: [{ item: 'Original item', itemNumber: 0 }],
          },
        })
        createdFieldTypeIds.push(created.id)

        const apiKey = await getFieldTypesApiKey(true, false)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            id: created.id,
            data: {
              arrayField: [
                { item: 'Updated item A', itemNumber: 10 },
                { item: 'Updated item B', itemNumber: 20 },
                { item: 'Updated item C', itemNumber: 30 },
              ],
            },
          },
          name: 'updateDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

        expect(doc.arrayField).toHaveLength(3)
        expect(doc.arrayField[0].item).toBe('Updated item A')
        expect(doc.arrayField[2].itemNumber).toBe(30)
      })
    })

    describe('Display field safety', () => {
      it('should create document with ui field present without errors and ui field absent from response', async ({
        mcp,
      }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)

        // Create a doc without passing any `uiField` value (it has no stored data)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'UI field safety test',
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()
        expect(callResponse.content[0].text).toContain('Document created successfully')

        const doc = getToolDoc(callResponse)

        // uiField has no stored data and should not appear in the document
        expect(doc).not.toHaveProperty('uiField')

        createdFieldTypeIds.push(doc.id)
      })

      it('should create and find document with all structural layout fields populated', async ({
        mcp,
      }) => {
        const apiKey = await getFieldTypesApiKey(false, true)
        const client = await mcp.connect(apiKey)
        const callResponse = await client.callTool({
          arguments: {
            collectionSlug: 'field-types',
            data: {
              textField: 'All layout fields test',
              groupField: { groupText: 'Group value', groupNumber: 5 },
              collapsibleText: 'Collapsible value',
              rowText: 'Row value',
              namedTab: { namedTabText: 'Named tab value' },
              unnamedTabText: 'Unnamed tab value',
            },
          },
          name: 'createDocument',
        })

        expect(callResponse).toBeDefined()
        expect(callResponse.isError).toBeFalsy()

        const doc = getToolDoc(callResponse)

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
