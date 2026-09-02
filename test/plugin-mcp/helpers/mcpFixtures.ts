import type { ProtocolEra } from '@modelcontextprotocol/client'
import type { Payload } from 'payload'

import { randomUUID } from 'crypto'
import path from 'path'
import { payloadAPIKeysCollectionSlug } from 'payload'
import { fileURLToPath } from 'url'
import { test as base, onTestFinished } from 'vitest'

import type { TestRBAC } from '../../__helpers/plugins/rbac/index.js'
import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'
import type { McpClient } from './mcpClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { devUser } from '../../credentials.js'
import { createMcpClient } from './mcpClient.js'

export let payload: Payload
export let restClient: NextRESTClient
export let limitedUserId: string
export let userId: string

// `userId` is the persistent dev user, never deleted between tests, so keys minted for it
// via getApiKey are tracked here and cleaned up in the worker teardown below.
const createdDevUserKeyIDs: Array<number | string> = []

export async function getApiKey(rbac: TestRBAC = {}): Promise<string> {
  await payload.update({
    id: userId,
    collection: 'users',
    data: { rbac },
    overrideAccess: true,
  })

  const key = await payload.create({
    collection: payloadAPIKeysCollectionSlug,
    data: {
      name: `MCP test key ${randomUUID()}`,
      owner: { relationTo: 'users', value: userId },
    },
    overrideAccess: true,
  })
  createdDevUserKeyIDs.push(key.id)

  return key.apiKey as string
}

export async function getLimitedApiKey(): Promise<string> {
  const key = await payload.create({
    collection: payloadAPIKeysCollectionSlug,
    data: {
      name: `MCP limited test key ${randomUUID()}`,
      owner: { relationTo: 'users', value: limitedUserId },
    },
    overrideAccess: true,
  })

  return key.apiKey as string
}

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))
const suiteDir = path.resolve(fixtureDir, '..')

type McpTestContext = {
  mcp: McpClient
  protocolEra: ProtocolEra
}

type McpTestFunction = (context: McpTestContext) => Promise<void> | void

type ScopedFixtures = {
  $worker: { _setup: void }
}

const payloadTest = base.extend<ScopedFixtures>({
  _setup: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const initialized = await initPayloadInt(suiteDir)
      payload = initialized.payload
      restClient = initialized.restClient

      const loginResponse: { user: { id: string } } = await restClient
        .POST('/users/login', {
          body: JSON.stringify({ email: devUser.email, password: devUser.password }),
        })
        .then((res) => res.json())
      userId = loginResponse.user.id

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
      limitedUserId = limitedUser.id

      await use()

      if (createdDevUserKeyIDs.length > 0) {
        await payload.delete({
          collection: payloadAPIKeysCollectionSlug,
          overrideAccess: true,
          where: { id: { in: createdDevUserKeyIDs } },
        })
        createdDevUserKeyIDs.length = 0
      }
      await payload.delete({
        id: limitedUserId,
        collection: 'users',
        overrideAccess: true,
      })
      await payload.destroy()
    },
    { auto: true, scope: 'worker' },
  ],
})

const protocolEras: Array<{ label: string; protocolEra: ProtocolEra }> = [
  { label: '2025 legacy', protocolEra: 'legacy' },
  { label: '2026 modern', protocolEra: 'modern' },
]

/** Registers every MCP integration test independently against both protocol eras. */
export function it(name: string, test: McpTestFunction, timeout?: number): void {
  for (const { label, protocolEra } of protocolEras) {
    registerMcpTest({ name, label, protocolEra, test, timeout })
  }
}

/** Registers an integration test for behavior that exists only in the modern era. */
export function itModern(name: string, test: McpTestFunction, timeout?: number): void {
  registerMcpTest({ name, label: '2026 modern', protocolEra: 'modern', test, timeout })
}

const registerMcpTest = ({
  name,
  label,
  protocolEra,
  test,
  timeout,
}: {
  label: string
  name: string
  protocolEra: ProtocolEra
  test: McpTestFunction
  timeout?: number
}): void => {
  payloadTest(
    `${name} [${label}]`,
    // eslint-disable-next-line no-empty-pattern
    async ({}) => {
      const mcp = createMcpClient({ protocolEra, restClient })

      onTestFinished(() => mcp.close())

      await test({ mcp, protocolEra })
    },
    timeout,
  )
}
