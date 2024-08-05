import type { Payload, SanitizedConfig } from 'payload'

import { getPayloadHMR } from '@payloadcms/next/utilities'
import path from 'path'

import { spawnInitProcess } from '../spawnInitProcess.js'
import { NextRESTClient } from './NextRESTClient.js'

/**
 * Initialize Payload configured for integration tests
 */
export async function initPayloadInt(
  dirname: string,
  testSuiteNameOverride?: string,
): Promise<{ config: SanitizedConfig; payload: Payload; restClient: NextRESTClient }> {
  const testSuiteName = testSuiteNameOverride ?? path.basename(dirname)
  await spawnInitProcess(testSuiteName, false)
  const { default: config } = await eval('import(path.resolve(dirname, "config.ts"))')

  const payload = await getPayloadHMR({ config })
  const restClient = new NextRESTClient(payload.config)

  return { config: payload.config, payload, restClient }
}
