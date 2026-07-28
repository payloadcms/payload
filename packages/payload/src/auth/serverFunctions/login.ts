import type { ServerAdapter } from '../../admin/adapters/server.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { AuthCollectionSlug } from '../../index.js'
import type { MaybePromise } from '../../types/index.js'
import type { LoginResult } from '../operations/login.js'

import { getPayload } from '../../index.js'
import { createLocalReq } from '../../utilities/createLocalReq.js'
import { loginWithCookie } from '../loginWithCookie.js'
import { applyAuthCookie } from './cookies.js'

export type LoginArgs<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  config: MaybePromise<SanitizedConfig>
  password: string
  serverAdapter: ServerAdapter
} & ({ email: string; username?: never } | { email?: never; username: string })

/**
 * `LoginArgs` as the adapters expose it — they bind `serverAdapter` themselves.
 * Distributes over the email/username union so the either-or survives; a plain
 * `Omit` collapses the union and accepts both keys at once.
 */
export type LoginArgsWithoutServerAdapter<TSlug extends AuthCollectionSlug> =
  LoginArgs<TSlug> extends infer TArgs
    ? TArgs extends unknown
      ? Omit<TArgs, 'serverAdapter'>
      : never
    : never

/**
 * Logs a user in and writes the auth cookie through the supplied `serverAdapter`,
 * so the function is framework-agnostic; each adapter binds its own.
 */
export async function login<TSlug extends AuthCollectionSlug>({
  collection,
  config,
  email,
  password,
  serverAdapter,
  username,
}: LoginArgs<TSlug>): Promise<LoginResult<TSlug>> {
  const payload = await getPayload({ config, cron: true })

  const authConfig = payload.collections[collection]?.config.auth

  if (!authConfig) {
    throw new Error(`No auth config found for collection: ${collection}`)
  }

  const loginWithUsername = authConfig.loginWithUsername ?? false

  if (loginWithUsername) {
    if (loginWithUsername.allowEmailLogin) {
      if (!email && !username) {
        throw new Error('Email or username is required.')
      }
    } else {
      if (!username) {
        throw new Error('Username is required.')
      }
    }
  } else {
    if (!email) {
      throw new Error('Email is required.')
    }
  }

  let loginData

  if (loginWithUsername) {
    loginData = username ? { password, username } : { email, password }
  } else {
    loginData = { email, password }
  }

  const collectionConfig = payload.collections[collection]!

  const { cookie, result } = await loginWithCookie({
    collection: collectionConfig,
    data: loginData as Parameters<typeof loginWithCookie>[0]['data'],
    req: await createLocalReq({}, payload),
    returnCookieAsObject: true,
  })

  await applyAuthCookie({ cookie, serverAdapter })

  return result as LoginResult<TSlug>
}
