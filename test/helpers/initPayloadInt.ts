import type { Payload, SanitizedConfig } from 'payload'

import { getPayloadHMR } from '@payloadcms/next/utilities'

import { NextRESTClient } from './NextRESTClient.js'

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt(
  config: Promise<SanitizedConfig>,
): Promise<{ config: SanitizedConfig; payload: Payload; restClient: NextRESTClient }> {
  const payload = await getPayloadHMR({ config })
  const restClient = new NextRESTClient(payload.config)

  return { config: payload.config, payload, restClient }
}
