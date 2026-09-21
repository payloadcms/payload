import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Payload, PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createLocalReq: vi.fn(),
}))

vi.mock('payload', () => ({
  createLocalReq: mocks.createLocalReq,
}))

import { authTool } from './auth.js'

type AuthToolResult = {
  content: Array<{
    text: string
    type: 'text'
  }>
}

type AuthToolHandler = (args: { headers?: string }) => Promise<AuthToolResult>

describe('authTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should omit user fields without read access from authentication status', async () => {
    const internalNotes = 'private authentication notes'
    const authenticatedUser = {
      _sid: 'session-id',
      _strategy: 'local-jwt',
      collection: 'users',
      id: 'user-id',
      internalNotes,
    }
    const payload = {
      auth: vi.fn(async ({ req }: { req: PayloadRequest }) => {
        req.user = authenticatedUser

        return { user: authenticatedUser }
      }),
      findByID: vi.fn(async ({ overrideAccess }: { overrideAccess: boolean }) =>
        overrideAccess
          ? authenticatedUser
          : { email: 'user@example.com', id: authenticatedUser.id },
      ),
      logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      },
    } as unknown as Payload
    const authReq = { payload } as PayloadRequest
    const req = { payload } as PayloadRequest
    let handler: AuthToolHandler | undefined
    const server = {
      registerTool: (_name: string, _definition: unknown, registeredHandler: AuthToolHandler) => {
        handler = registeredHandler
      },
    } as unknown as McpServer

    mocks.createLocalReq.mockResolvedValue(authReq)
    authTool(server, req, false)

    if (!handler) {
      throw new Error('Auth tool was not registered')
    }

    const result = await handler({
      headers: JSON.stringify({ Authorization: 'JWT token' }),
    })
    const json = result.content[0]!.text.match(/```json\n([\s\S]*?)\n```/)?.[1]

    expect(json).toBeDefined()

    const authenticationStatus = JSON.parse(json!)

    expect(authReq.user).toBe(authenticatedUser)
    expect(payload.findByID).toHaveBeenCalledWith({
      id: authenticatedUser.id,
      collection: authenticatedUser.collection,
      overrideAccess: false,
      req: authReq,
    })
    expect(authenticationStatus.user).toMatchObject({
      _sid: authenticatedUser._sid,
      _strategy: authenticatedUser._strategy,
      collection: authenticatedUser.collection,
      email: 'user@example.com',
      id: authenticatedUser.id,
    })
    expect(authenticationStatus.user).not.toHaveProperty('internalNotes')
    expect(JSON.stringify(authenticationStatus)).not.toContain(internalNotes)
  })
})
