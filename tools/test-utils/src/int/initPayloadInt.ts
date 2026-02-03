import type { PayloadSDK } from '@payloadcms/sdk'
import type { GeneratedTypes, Payload, SanitizedConfig } from 'payload'

import path from 'path'
import { getPayload } from 'payload'

import { runInit } from './runInit.js'
import { getSDK } from './sdk/getSDK.js'
import { NextRESTClient } from './NextRESTClient.js'

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt<TInitializePayload extends boolean | undefined = true>(
  dirname: string,
  testSuiteNameOverride?: string,
  initializePayload?: TInitializePayload,
  configFile?: string,
): Promise<
  TInitializePayload extends false
    ? { config: SanitizedConfig }
    : {
        config: SanitizedConfig
        payload: Payload
        restClient: NextRESTClient
        sdk: PayloadSDK<GeneratedTypes>
      }
> {
  const testSuiteName = testSuiteNameOverride ?? path.basename(dirname)
  await runInit(testSuiteName, false, true, configFile)
  console.log('importing config', path.resolve(dirname, configFile ?? 'config.ts'))
  const { default: config } = await import(path.resolve(dirname, configFile ?? 'config.ts'))

  if (initializePayload === false) {
    return { config: await config } as any
  }

  console.log('starting payload')

  const payload = await getPayload({ config, cron: true })
  console.log('initializing rest client')
  const restClient = new NextRESTClient(payload.config)
  console.log('initPayloadInt done')
  const sdk = getSDK(payload.config)
  return { config: payload.config, sdk, payload, restClient } as any
}
