import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

export type McpToolResultContent = {
  text: string
  type: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tool inputSchemas are JSON Schemas with arbitrary nested shapes
export type McpTool = { description?: string; inputSchema: any; name: string }

export type McpError = { code: number; data?: unknown; message: string }

/**
 * Envelope for a JSON-RPC response from the MCP endpoint. `TResult` narrows
 * the `result` payload per method (e.g. `{ content }` for tool calls, `{ tools }`
 * for tool listings). `result` is non-optional because the helpers below only
 * cover the success path; auth/error responses go through `rawPost`.
 */
export type McpResponse<TResult = Record<string, unknown>> = {
  error?: McpError
  id: number
  jsonrpc: '2.0'
  result: TResult
}

export type McpToolCallResult = {
  content: McpToolResultContent[]
}

export type McpListToolsResult = {
  tools: McpTool[]
}

async function parseMcpStream<TResult = Record<string, unknown>>(
  response: Response,
): Promise<McpResponse<TResult>> {
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

  const dataLine = streamData
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .pop()

  const jsonString = dataLine ? dataLine.slice('data:'.length).trim() : streamData.trim()
  return JSON.parse(jsonString)
}

export type McpClient = {
  callTool: (args: {
    apiKey: string
    args?: Record<string, unknown>
    id?: number
    name: string
  }) => Promise<McpResponse<McpToolCallResult>>
  listTools: (args: { apiKey: string; id?: number }) => Promise<McpResponse<McpListToolsResult>>
  rawPost: (args: { apiKey?: string; body: unknown }) => Promise<Response>
  request: <TResult = Record<string, unknown>>(args: {
    apiKey: string
    id?: number
    method: string
    params?: Record<string, unknown>
  }) => Promise<McpResponse<TResult>>
}

export function createMcpClient(restClient: NextRESTClient): McpClient {
  const post = async ({ apiKey, body }: { apiKey?: string; body: unknown }): Promise<Response> =>
    restClient.POST('/mcp', {
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json, text/event-stream',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        'Content-Type': 'application/json',
      },
    })

  const request: McpClient['request'] = async ({ apiKey, id = 1, method, params = {} }) => {
    const response = await post({ apiKey, body: { id, jsonrpc: '2.0', method, params } })
    return parseMcpStream(response)
  }

  return {
    callTool: ({ apiKey, args = {}, id, name }) =>
      request<McpToolCallResult>({
        apiKey,
        id,
        method: 'tools/call',
        params: { arguments: args, name },
      }),
    listTools: ({ apiKey, id }) =>
      request<McpListToolsResult>({ apiKey, id, method: 'tools/list' }),
    rawPost: post,
    request,
  }
}

/**
 * Returns the first text content block from a tool/call response
 */
export function getToolText(response: McpResponse<McpToolCallResult>): string {
  const text = response.result.content?.[0]?.text
  if (typeof text !== 'string') {
    throw new Error(`MCP response has no text content: ${JSON.stringify(response, null, 2)}`)
  }
  return text
}

/**
 * Extracts the JSON document block (```json ... ```) from a tool/call response
 * text.
 */
export function getToolDoc<T = Record<string, unknown>>(
  response: McpResponse<McpToolCallResult>,
): T {
  const text = getToolText(response)
  const match = text.match(/```json\n([\s\S]*?)\n```/)
  if (!match) {
    throw new Error(`MCP response text contained no \`\`\`json block: ${text}`)
  }
  return JSON.parse(match[1]!) as T
}
