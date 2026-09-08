import type { RefreshArgs } from 'payload/auth'

import { refresh as refreshFn } from 'payload/auth'

import { tanstackServerAdapter } from '../utilities/serverAdapter.server.js'

export async function refresh(
  args: Omit<RefreshArgs, 'serverAdapter'>,
): Promise<{ message: string; success: boolean }> {
  return refreshFn({ ...args, serverAdapter: tanstackServerAdapter })
}
