import type { Payload, SanitizedConfig } from 'payload'

import path from 'path'
import { getPayload } from 'payload'

import { runInit } from '../runInit.js'
import { NextRESTClient } from './NextRESTClient.js'

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt<TInitializePayload extends boolean | undefined = true>(
  dirname: string,
  testSuiteNameOverride?: string,
  initializePayload?: TInitializePayload,
): Promise<
  TInitializePayload extends false
    ? { config: SanitizedConfig }
    : { config: SanitizedConfig; payload: Payload; restClient: NextRESTClient }
> {
  const testSuiteName = testSuiteNameOverride ?? path.basename(dirname)
  await runInit(testSuiteName, false, true)
  console.log('importing config', path.resolve(dirname, 'config.ts'))
  const { default: config } = await import(path.resolve(dirname, 'config.ts'))

  if (initializePayload === false) {
    return { config: await config } as any
  }

  console.log('starting payload')

  const payload = await getPayload({ config })
  console.log('initializing rest client')
  const restClient = new NextRESTClient(payload.config)
  console.log('initPayloadInt done')
  return { config: payload.config, payload, restClient } as any
}
