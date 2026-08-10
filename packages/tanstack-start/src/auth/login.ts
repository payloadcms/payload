import type { AuthCollectionSlug, LoginResult } from 'payload'

import { type LoginArgs, type LoginArgsWithoutServerAdapter, login as loginFn } from 'payload/auth'

import { tanstackServerAdapter } from '../utilities/serverAdapter.server.js'

export async function login<TSlug extends AuthCollectionSlug>(
  args: LoginArgsWithoutServerAdapter<TSlug>,
): Promise<LoginResult<TSlug>> {
  return loginFn({ ...args, serverAdapter: tanstackServerAdapter } as LoginArgs<TSlug>)
}
