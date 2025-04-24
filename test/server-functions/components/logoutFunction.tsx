'use server'
import { logout } from '@payloadcms/next/auth'

import config from '../config.js'

export async function logoutFunction() {
  try {
    return await logout({
      config,
    })
  } catch (error) {
    throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
