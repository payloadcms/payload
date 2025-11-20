import type { PayloadSDK } from '@payloadcms/sdk'
import type { GeneratedTypes, Payload, SanitizedConfig } from 'payload'

import path from 'path'
import { getPayload } from 'payload'

import { runInit } from '../runInit.js'
import { getSDK } from './getSDK.js'
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

  // For Content API: Clear the database before each test suite
  if (process.env.PAYLOAD_DATABASE === 'content-api') {
    console.log('[initPayloadInt] CONTENT_SYSTEM_ID:', process.env.CONTENT_SYSTEM_ID)
    try {
      const response = await fetch(
        `${process.env.CONTENT_API_URL || 'http://localhost:8080'}/dev/clear-db`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentSystemId: process.env.CONTENT_SYSTEM_ID }),
        },
      )
      if (response.ok) {
        const data = await response.json()
        console.log('[initPayloadInt] Clear-db response:', JSON.stringify(data))
      } else {
        console.warn('Failed to clear content-api database:', response.status)
      }
    } catch (error) {
      console.warn('Failed to clear content-api database:', error.message)
    }
  }

  await runInit(testSuiteName, false, true, configFile)
  console.log('importing config', path.resolve(dirname, configFile ?? 'config.ts'))
  const { default: config } = await import(path.resolve(dirname, configFile ?? 'config.ts'))

  if (initializePayload === false) {
    return { config: await config } as any
  }

  console.log('starting payload')

  // For Content API: Check if users exist BEFORE getPayload
  if (process.env.PAYLOAD_DATABASE === 'content-api') {
    try {
      const response = await fetch(
        `${process.env.CONTENT_API_URL || 'http://localhost:8080'}/api/v0/documents:find`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionKey: 'users',
            contentSystemId: process.env.CONTENT_SYSTEM_ID,
            limit: 10,
            offset: 0,
          }),
        },
      )
      if (response.ok) {
        const data = await response.json()
        console.log('[initPayloadInt] Users BEFORE getPayload:', data.result.data.length)
      }
    } catch (error) {
      console.log('[initPayloadInt] Could not check users:', error.message)
    }
  }

  const payload = await getPayload({ config, cron: true })
  console.log('initializing rest client')
  const restClient = new NextRESTClient(payload.config)
  console.log('initPayloadInt done')
  const sdk = getSDK(payload.config)
  return { config: payload.config, sdk, payload, restClient } as any
}
