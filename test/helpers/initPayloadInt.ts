import type { SanitizedConfig } from 'payload/config'

import { type Payload, getPayload } from 'payload'

import { NextRESTClient } from './NextRESTClient.js'

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt(
  config: Promise<SanitizedConfig>,
): Promise<{ config: SanitizedConfig; payload: Payload; restClient: NextRESTClient }> {
  // @ts-expect-error
  process.env.NODE_ENV = 'test'
  process.env.NODE_OPTIONS = '--no-deprecation'
  process.env.PAYLOAD_DROP_DATABASE = 'true'

  const payload = await getPayload({ config })
  const restClient = new NextRESTClient(payload.config)

  return { config: payload.config, payload, restClient }
}
