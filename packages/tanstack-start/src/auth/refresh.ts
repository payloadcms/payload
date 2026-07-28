import type { RefreshArgs } from '@payloadcms/ui/auth'

import { refresh as sharedRefresh } from '@payloadcms/ui/auth'

import { tanstackServerAdapter } from '../utilities/serverAdapter.server.js'

export async function refresh(
  args: Omit<RefreshArgs, 'serverAdapter'>,
): Promise<{ message: string; success: boolean }> {
  return sharedRefresh({ ...args, serverAdapter: tanstackServerAdapter })
}
