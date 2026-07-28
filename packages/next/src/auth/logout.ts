'use server'

import type { LogoutArgs } from 'payload/auth'

import { logout as sharedLogout } from 'payload/auth'

import { nextServerAdapter } from '../adapters/server.js'

export async function logout(
  args: Omit<LogoutArgs, 'serverAdapter'>,
): Promise<{ message: string; success: boolean }> {
  return sharedLogout({ ...args, serverAdapter: nextServerAdapter })
}
