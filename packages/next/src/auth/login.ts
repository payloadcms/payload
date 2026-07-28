'use server'

import type { AuthCollectionSlug, LoginResult } from 'payload'

import {
  type LoginArgs,
  type LoginArgsWithoutServerAdapter,
  login as sharedLogin,
} from 'payload/auth'

import { nextServerAdapter } from '../adapters/server.js'

export async function login<TSlug extends AuthCollectionSlug>(
  args: LoginArgsWithoutServerAdapter<TSlug>,
): Promise<LoginResult<TSlug>> {
  return sharedLogin({ ...args, serverAdapter: nextServerAdapter } as LoginArgs<TSlug>)
}
