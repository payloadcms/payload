import type { AuthCollectionSlug, LoginResult } from 'payload'

import {
  type LoginArgs,
  type LoginArgsWithoutServerAdapter,
  login as sharedLogin,
} from '@payloadcms/ui/auth'

import { tanstackServerAdapter } from '../utilities/serverAdapter.server.js'

export async function login<TSlug extends AuthCollectionSlug>(
  args: LoginArgsWithoutServerAdapter<TSlug>,
): Promise<LoginResult<TSlug>> {
  return sharedLogin({ ...args, serverAdapter: tanstackServerAdapter } as LoginArgs<TSlug>)
}
