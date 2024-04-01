import type { SanitizedConfig } from 'payload/config'

import path from 'path'
import { type Payload, getPayload } from 'payload'

import { NextRESTClient } from './NextRESTClient.js'
import { startMemoryDB } from './startMemoryDB.js'

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt(
  dirname: string,
): Promise<{ config: SanitizedConfig; payload: Payload; restClient: NextRESTClient }> {
  await startMemoryDB()
  const { default: config } = await import(path.resolve(dirname, 'config.ts'))
  const payload = await getPayload({ config })
  const restClient = new NextRESTClient(payload.config)

  return { config: payload.config, payload, restClient }
}
