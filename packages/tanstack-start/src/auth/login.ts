import type { AuthCollectionSlug, LoginResult, MaybePromise, SanitizedConfig } from 'payload'

import { getPayload } from 'payload'

import { setPayloadAuthCookie } from '../utilities/setPayloadAuthCookie.js'

type LoginWithEmail = {
  email: string
  username?: never
}

type LoginWithUsername = {
  email?: never
  username: string
}

type LoginArgs = {
  collection: AuthCollectionSlug
  config: MaybePromise<SanitizedConfig>
  password: string
} & (LoginWithEmail | LoginWithUsername)

export async function login<TSlug extends AuthCollectionSlug>({
  collection,
  config,
  email,
  password,
  username,
}: LoginArgs): Promise<LoginResult<TSlug>> {
  const payload = await getPayload({ config })

  const authConfig = payload.collections[collection]?.config.auth

  if (!authConfig) {
    throw new Error(`No auth config found for collection: ${collection}`)
  }

  const loginWithUsername = authConfig?.loginWithUsername ?? false

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

  const result = await payload.login({
    collection,
    data: (loginWithUsername
      ? username
        ? { password, username }
        : { email, password }
      : { email, password }) as { email: string; password: string },
  })

  if (result.token) {
    setPayloadAuthCookie({
      authConfig,
      cookiePrefix: payload.config.cookiePrefix,
      token: result.token,
    })
  }

  return result as LoginResult<TSlug>
}
