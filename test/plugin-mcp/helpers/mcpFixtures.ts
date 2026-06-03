import type { Payload } from 'payload'

import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import { test as base } from 'vitest'

import type { NextRESTClient } from '../../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'
import { devUser } from '../../credentials.js'
import { createMcpClient, type McpClient } from './mcpClient.js'

export let payload: Payload
export let restClient: NextRESTClient
export let userId: string

export type GetApiKeyOptions = {
  enableDelete?: boolean
  enableUpdate?: boolean
  globalFind?: boolean
  globalUpdate?: boolean
}

export async function getApiKey({
  enableDelete = false,
  enableUpdate = false,
  globalFind = false,
  globalUpdate = false,
}: GetApiKeyOptions = {}): Promise<string> {
  const doc = await payload.create({
    collection: 'payload-mcp-api-keys',
    data: {
      access: {
        collections: {
          posts: { create: true, delete: enableDelete, find: true, update: enableUpdate },
          products: { find: true },
        },
        ...(globalFind || globalUpdate
          ? { globals: { 'site-settings': { find: globalFind, update: globalUpdate } } }
          : {}),
      },
      apiKey: randomUUID(),
      enableAPIKey: true,
      label: 'Test API Key',
      user: userId,
    },
  })
  return doc.apiKey as string
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
    await use(createMcpClient(restClient))
  },
})
