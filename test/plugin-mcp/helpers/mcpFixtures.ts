import type { ProtocolEra } from '@modelcontextprotocol/client'
import type { Payload } from 'payload'

import { randomUUID } from 'crypto'
import { onTestFinished } from 'vitest'

import type { TestRBAC } from '../../__helpers/plugins/rbac/index.js'
import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'
import type { McpClient } from './mcpClient.js'

import { test as base } from '../../__helpers/int/vitest.js'
import { devUser } from '../../credentials.js'
import { createMcpClient } from './mcpClient.js'

type McpSetup = {
  getApiKey: (rbac?: TestRBAC) => Promise<string>
  getLimitedApiKey: () => Promise<string>
  limitedUserId: number | string
  userId: number | string
}

type McpTestContext = {
  mcp: McpClient
  payload: Payload
  protocolEra: ProtocolEra
  restClient: NextRESTClient
} & McpSetup

type McpTestFunction = (context: McpTestContext) => Promise<void> | void

const payloadTest = base.extend<'mcpSetup', McpSetup>(
  'mcpSetup',
  { auto: true, scope: 'file' },
  async ({ payloadInstance: payload, restClientInstance: restClient }, { onCleanup }) => {
    const loginResponse: { user: { id: number | string } } = await restClient
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

    onCleanup(() =>
      payload.delete({
        id: limitedUserId,
        collection: 'users',
        overrideAccess: true,
      }),
    )

    return { getApiKey, getLimitedApiKey, limitedUserId, userId }
  },
)

export const protocolEras: Array<{ label: string; protocolEra: ProtocolEra }> = [
  { label: '2025 legacy', protocolEra: 'legacy' },
  { label: '2026 modern', protocolEra: 'modern' },
]

export const test = Object.assign(payloadTest, {
  suite: base.suite,
})

/** Keeps test names unchanged; describe.for supplies the protocol-era groups. */
export const createMcpTests = ({ protocolEra }: { protocolEra: ProtocolEra }) => {
  const registerMcpTest = ({
    name,
    shouldRun = true,
    testFunction,
    timeout,
  }: {
    name: string
    shouldRun?: boolean
    testFunction: McpTestFunction
    timeout?: number
  }): void => {
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
    it: (name: string, testFunction: McpTestFunction, timeout?: number): void => {
      registerMcpTest({ name, testFunction, timeout })
    },
    testModern: (name: string, testFunction: McpTestFunction, timeout?: number): void => {
      registerMcpTest({ name, shouldRun: protocolEra === 'modern', testFunction, timeout })
    },
  }
}
