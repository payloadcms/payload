import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import crypto from 'crypto'
import { type PayloadHandler, type TypedUser, UnauthorizedError, type Where } from 'payload'

import type { MCPAccessSettings, MCPPluginConfig } from '../types.js'

import { createRequestFromPayloadRequest } from '../mcp/createRequest.js'
import { buildMcpServer, getMCPHandler } from '../mcp/getMcpHandler.js'

const methodNotAllowedResponse = () =>
  new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    }),
    {
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
      status: 405,
    },
  )

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getMessageID = (message: unknown) => {
  if (!isRecord(message)) {
    return
  }

  const { id } = message

  return typeof id === 'number' || typeof id === 'string' ? String(id) : undefined
}

const instrumentTransport = (
  transport: WebStandardStreamableHTTPServerTransport,
  onEvent?: (event: unknown) => void,
) => {
  if (!onEvent) {
    return
  }

  const requestMetadata = new Map<
    string,
    {
      method: string
      requestId: string
      startTime: number
    }
  >()

  const emit = (event: Record<string, unknown>) => {
    onEvent({
      ...event,
      timestamp: Date.now(),
    })
  }

  transport.onmessage = (message) => {
    const messageRecord: unknown = message

    if (!isRecord(messageRecord) || typeof messageRecord.method !== 'string') {
      return
    }

    const requestId = crypto.randomUUID()
    const messageID = getMessageID(messageRecord)

    if (messageID) {
      requestMetadata.set(messageID, {
        method: messageRecord.method,
        requestId,
        startTime: Date.now(),
      })
    }

    emit({
      method: messageRecord.method,
      parameters: messageRecord.params,
      requestId,
      status: 'success',
      type: 'REQUEST_RECEIVED',
    })
  }

  const send = transport.send.bind(transport)

  transport.send = async (message, options) => {
    const messageRecord: unknown = message
    const messageID = getMessageID(messageRecord)
    const metadata = messageID ? requestMetadata.get(messageID) : undefined

    if (
      messageID &&
      metadata &&
      isRecord(messageRecord) &&
      ('result' in messageRecord || 'error' in messageRecord)
    ) {
      emit({
        duration: Date.now() - metadata.startTime,
        error: messageRecord.error,
        method: metadata.method,
        requestId: metadata.requestId,
        result: messageRecord.result,
        status: 'error' in messageRecord ? 'error' : 'success',
        type: 'REQUEST_COMPLETED',
      })
      requestMetadata.delete(messageID)
    }

    try {
      await send(message, options)
    } catch (error) {
      emit({
        context: 'Error sending MCP response',
        error,
        severity: 'error',
        source: 'request',
        type: 'ERROR',
      })

      throw error
    }
  }
}

export const initializeMCPHandler = (pluginOptions: MCPPluginConfig) => {
  const mcpHandler: PayloadHandler = async (req) => {
    const { payload } = req
    const MCPOptions = pluginOptions.mcp || {}
    const MCPHandlerOptions = MCPOptions.handlerOptions || {}
    const useVerboseLogs = MCPHandlerOptions.verboseLogs ?? false

    req.payloadAPI = 'MCP' as const

    const getDefaultMcpAccessSettings = async (overrideApiKey?: null | string) => {
      const apiKey =
        (overrideApiKey ?? req.headers.get('Authorization')?.startsWith('Bearer '))
          ? req.headers.get('Authorization')?.replace('Bearer ', '').trim()
          : null

      if (apiKey === null) {
        throw new UnauthorizedError()
      }

      const sha256APIKeyIndex = crypto
        .createHmac('sha256', payload.secret)
        .update(apiKey || '')
        .digest('hex')

      const where: Where = {
        apiKeyIndex: {
          equals: sha256APIKeyIndex,
        },
      }

      const { docs } = await payload.find({
        collection: 'payload-mcp-api-keys',
        depth: 1,
        limit: 1,
        pagination: false,
        where,
      })

      if (docs.length === 0) {
        throw new UnauthorizedError()
      }

      if (useVerboseLogs) {
        payload.logger.info('[payload-mcp] API Key is valid')
      }

      const user = docs[0]?.user as TypedUser
      user.collection = pluginOptions.userCollection as string
      user._strategy = 'mcp-api-key' as const

      return docs[0] as unknown as MCPAccessSettings
    }

    const mcpAccessSettings = pluginOptions.overrideAuth
      ? await pluginOptions.overrideAuth(req, getDefaultMcpAccessSettings)
      : await getDefaultMcpAccessSettings()

    const request = createRequestFromPayloadRequest(req)

    if ((MCPHandlerOptions.disableSse ?? true) === false) {
      const handler = getMCPHandler(pluginOptions, mcpAccessSettings, req)

      return await handler(request)
    }

    if (req.method !== 'POST') {
      return methodNotAllowedResponse()
    }

    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
      sessionIdGenerator: undefined,
    })
    instrumentTransport(transport, MCPHandlerOptions.onEvent)

    const server = buildMcpServer(pluginOptions, mcpAccessSettings, req)

    await server.connect(transport)

    try {
      return await transport.handleRequest(request)
    } finally {
      await server.close()
    }
  }
  return mcpHandler
}
