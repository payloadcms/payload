import type { Payload, SanitizedConfig } from 'payload'

import path from 'path'
import { getPayload } from 'payload'

import { runInit } from '../runInit.js'
import { NextRESTClient } from './NextRESTClient.js'

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt(
  dirname: string,
  testSuiteNameOverride?: string,
): Promise<{ config: SanitizedConfig; payload: Payload; restClient: NextRESTClient }> {
  const testSuiteName = testSuiteNameOverride ?? path.basename(dirname)
  await runInit(testSuiteName, false)
  const { default: config } = await eval('import(path.resolve(dirname, "config.ts"))')

  const payload = await getPayload({ config })
  const restClient = new NextRESTClient(payload.config)

  return { config: payload.config, payload, restClient }
}
