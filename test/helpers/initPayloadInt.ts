import type { SanitizedConfig } from 'payload/config'

import { type Payload, getPayload } from 'payload'

import { startMemoryDB } from '../startMemoryDB.js'
import { NextRESTClient } from './NextRESTClient.js'

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt(
  configPromise: Promise<SanitizedConfig>,
): Promise<{ config: SanitizedConfig; payload: Payload; restClient: NextRESTClient }> {
  const config = await startMemoryDB(configPromise)
  const payload = await getPayload({ config })
  const restClient = new NextRESTClient(payload.config)

  return { config, payload, restClient }
}
