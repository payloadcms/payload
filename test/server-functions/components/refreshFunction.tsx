'use server'

import { refresh } from '@payloadcms/next/auth'

import config from '../config.js'

export async function refreshFunction() {
  try {
    return await refresh({
      config,
    })
  } catch (error) {
    throw new Error(`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
