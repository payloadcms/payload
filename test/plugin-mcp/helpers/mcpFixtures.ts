import type { Payload } from 'payload'

import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { test as base } from 'vitest'

import type { TestRBAC } from '../../__helpers/plugins/rbac/index.js'
import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { devUser } from '../../credentials.js'
import { createMcpClient, type McpClient } from './mcpClient.js'

export let payload: Payload
export let restClient: NextRESTClient
export let userId: string

export async function getApiKey(rbac: TestRBAC = {}): Promise<string> {
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

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))
const suiteDir = path.resolve(fixtureDir, '..')

type ScopedFixtures = {
  $test: { mcp: McpClient }
  $worker: { _setup: void }
}

export const it = base.extend<ScopedFixtures>({
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

      await use()

      await payload.destroy()
    },
    { auto: true, scope: 'worker' },
  ],
  // eslint-disable-next-line no-empty-pattern
  mcp: async ({}, use) => {
    const client = createMcpClient(restClient)
    await use(client)
    await client.close()
  },
})
