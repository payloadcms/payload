import type {
  AuthCollectionSlug,
  LoginResult,
  MaybePromise,
  SanitizedConfig,
  ServerAdapter,
} from 'payload'

import { getPayload } from 'payload'

import { setAuthCookie } from './cookies.js'

export type LoginArgs<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  config: MaybePromise<SanitizedConfig>
  password: string
  serverAdapter: ServerAdapter
} & ({ email: string; username?: never } | { email?: never; username: string })

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

  const result = await payload.login({
    collection,
    data: loginData,
  })

  if (result.token) {
    await setAuthCookie({
      authConfig,
      cookiePrefix: payload.config.cookiePrefix,
      serverAdapter,
      token: result.token,
    })
  }

  if (authConfig.removeTokenFromResponses) {
    delete result.token
  }

  return result
}
