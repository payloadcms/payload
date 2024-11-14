import type { Payload, SanitizedConfig } from 'payload'

import { getPayloadHMR } from '@payloadcms/next/utilities'
import path from 'path'

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
  await runInit(testSuiteName, false, true)
  console.log('importing config', path.resolve(dirname, 'config.ts'))
  const { default: config } = await import(path.resolve(dirname, 'config.ts'))
  console.log('starting payload')

  // need to use getPayloadHMR and not getPayload, as getPayloadHMR will be used in next handlers. If we use getPayload
  // here, payload would be cached somewhere else
  const payload = await getPayloadHMR({ config })
  console.log('initializing rest client')
  const restClient = new NextRESTClient(payload.config)
  console.log('initPayloadInt done')
  return { config: payload.config, payload, restClient }
}
