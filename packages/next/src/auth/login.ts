'use server'

import type { AuthCollectionSlug, LoginResult } from 'payload'

import { type LoginArgs, login as sharedLogin } from '@payloadcms/ui/auth'

import { nextServerAdapter } from '../adapters/server.js'

export async function login<TSlug extends AuthCollectionSlug>(
  args: Omit<LoginArgs<TSlug>, 'serverAdapter'>,
): Promise<LoginResult<TSlug>> {
  return sharedLogin({ ...args, serverAdapter: nextServerAdapter } as LoginArgs<TSlug>)
}
