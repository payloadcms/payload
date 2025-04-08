'use server'
import { logout } from '@payloadcms/next/server-functions'

import config from '../config.js'

export async function logoutFunction() {
  return await logout({
    config,
  })
}
