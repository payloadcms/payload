'use server'

import type { LogoutArgs } from '@payloadcms/ui/auth'

import { logout as sharedLogout } from '@payloadcms/ui/auth'

import { nextServerAdapter } from '../adapters/server.js'

export async function logout(
  args: Omit<LogoutArgs, 'serverAdapter'>,
): Promise<{ message: string; success: boolean }> {
  return sharedLogout({ ...args, serverAdapter: nextServerAdapter })
}
