import type { Payload, SanitizedConfig } from 'payload'

import path from 'path'
import { getPayload } from 'payload'

import { initDevAndTest } from '../initDevAndTest.js'
import { NextRESTClient } from './NextRESTClient.js'

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt(
  dirname: string,
  testSuiteNameOverride?: string,
  initializePayload = true,
): Promise<{ config: SanitizedConfig; payload?: Payload; restClient?: NextRESTClient }> {
  const testSuite = testSuiteNameOverride ?? path.basename(dirname)
  await initDevAndTest({ testSuite, writeDBAdapter: false, skipGenImportMap: true })
  console.log('importing config', path.resolve(dirname, 'config.ts'))
  const { default: config } = await import(path.resolve(dirname, 'config.ts'))

  if (!initializePayload) {
    return { config: await config }
  }

  console.log('starting payload')

  const payload = await getPayload({ config })
  console.log('initializing rest client')
  const restClient = new NextRESTClient(payload.config)
  console.log('initPayloadInt done')
  return { config: payload.config, payload, restClient }
}
