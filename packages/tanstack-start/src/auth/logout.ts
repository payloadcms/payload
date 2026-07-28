import type { LogoutArgs } from 'payload/auth'

import { logout as logoutFn } from 'payload/auth'

import { tanstackServerAdapter } from '../utilities/serverAdapter.server.js'

export async function logout(
  args: Omit<LogoutArgs, 'serverAdapter'>,
): Promise<{ message: string; success: boolean }> {
  return logoutFn({ ...args, serverAdapter: tanstackServerAdapter })
}
