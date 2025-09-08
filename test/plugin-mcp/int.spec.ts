import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function fetchStreamResponse(request: Request): Promise<string> {
  const response = await fetch(request)
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

  return streamJSONString
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
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should not allow GET /api/mcp', async () => {
    const data = await restClient
      .GET(`/mcp`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => res.json())

    expect(data).toBeDefined()
    expect(data.jsonrpc).toBe('2.0')
    expect(data.error).toBeDefined()
    expect(data.error.code).toBe(-32000)
    expect(data.error.message).toBe('Method not allowed.')
  })

  it('should list tools', async () => {
    const request = new Request(`${restClient.serverURL}/api/mcp`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
      }),
    })

    const streamJSONString = await fetchStreamResponse(request)

    const json = JSON.parse(streamJSONString)

    expect(json).toBeDefined()
    expect(json.id).toBe(1)
    expect(json.jsonrpc).toBe('2.0')
    expect(json.result).toBeDefined()
    expect(json.result.tools).toBeDefined()
    expect(json.result.tools).toHaveLength(2)
    expect(json.result.tools[0].name).toBe('findResource')
    expect(json.result.tools[0].description).toBe(
      'Finds documents in a Payload collection using Find or FindByID. Possible collections are: media, posts',
    )
    expect(json.result.tools[0].inputSchema).toBeDefined()
    expect(json.result.tools[1].name).toBe('diceRoll')
    expect(json.result.tools[1].description).toBe(
      'Rolls a virtual dice with a specified number of sides',
    )
    expect(json.result.tools[1].inputSchema).toBeDefined()
  })
})
