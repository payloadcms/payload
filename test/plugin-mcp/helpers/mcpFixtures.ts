import type { ProtocolEra } from '@modelcontextprotocol/client'
import type { Payload } from 'payload'

import { randomUUID } from 'crypto'
import { onTestFinished } from 'vitest'

import type { TestRBAC } from '../../__helpers/plugins/rbac/index.js'
import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'
import type { McpClient } from './mcpClient.js'

import { test as baseTest } from '../../__helpers/int/vitest.js'
import { devUser } from '../../credentials.js'
import { createMcpClient } from './mcpClient.js'

type McpSetup = {
  getApiKey: (rbac?: TestRBAC) => Promise<string>
  getLimitedApiKey: () => Promise<string>
  limitedUserId: string
  userId: string
}

type McpTestContext = {
  mcp: McpClient
  payload: Payload
  protocolEra: ProtocolEra
  restClient: NextRESTClient
} & McpSetup

type McpTestFunction = (context: McpTestContext) => Promise<void> | void

export const protocolEras: Array<{ label: string; protocolEra: ProtocolEra }> = [
  { label: '2025 legacy', protocolEra: 'legacy' },
  { label: '2026 modern', protocolEra: 'modern' },
]

export const createMcpTests = ({ protocolEra }: { protocolEra: ProtocolEra }) => {
  const payloadTest = baseTest.extend<'mcpSetup', McpSetup>(
    'mcpSetup',
    { auto: true },
    async ({ payload, restClient }) => {
      const loginResponse: { user: { id: string } } = await restClient
        .POST('/users/login', {
          body: JSON.stringify({ email: devUser.email, password: devUser.password }),
        })
        .then((res) => res.json())
      const userId = loginResponse.user.id

      const limitedUser = await payload.create({
        collection: 'users',
        data: {
          email: 'limited-mcp-user@payloadcms.com',
          password: randomUUID(),
          rbac: {
            globals: {
              'site-settings': {
                update: false,
              },
            },
          } satisfies TestRBAC,
        },
        overrideAccess: true,
      })
      const limitedUserId = limitedUser.id

      const getApiKey = async (rbac: TestRBAC = {}): Promise<string> => {
        const apiKey = randomUUID()

        await payload.update({
          id: userId,
          collection: 'users',
          data: {
            apiKey,
            enableAPIKey: true,
            rbac,
          },
          overrideAccess: true,
        })

        return apiKey
      }

      const getLimitedApiKey = async (): Promise<string> => {
        const apiKey = randomUUID()

        await payload.update({
          id: limitedUserId,
          collection: 'users',
          data: {
            apiKey,
            enableAPIKey: true,
          },
          overrideAccess: true,
        })

        return apiKey
      }

      return { getApiKey, getLimitedApiKey, limitedUserId, userId }
    },
  )

  const register = (
    name: string,
    testFunction: McpTestFunction,
    timeout?: number,
    shouldRun = true,
  ): void => {
    payloadTest.runIf(shouldRun)(
      name,
      async ({ mcpSetup, payload, restClient }) => {
        const mcp = createMcpClient({ protocolEra, restClient })

        onTestFinished(() => mcp.close())

        await testFunction({ mcp, payload, protocolEra, restClient, ...mcpSetup })
      },
      timeout,
    )
  }

  return {
    /** Registers an MCP integration test for the current protocol era. */
    it: (name: string, testFunction: McpTestFunction, timeout?: number): void => {
      register(name, testFunction, timeout)
    },
    /** Registers behavior that exists only in the modern protocol era. */
    testModern: (name: string, testFunction: McpTestFunction, timeout?: number): void => {
      register(name, testFunction, timeout, protocolEra === 'modern')
    },
  }
}
