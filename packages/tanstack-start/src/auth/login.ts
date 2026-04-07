import type { AuthCollectionSlug, LoginResult, MaybePromise, SanitizedConfig } from 'payload'

import { createServerFn } from '@tanstack/react-start'
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

export const loginServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: LoginArgs) => data)
  .handler(async ({ data }): Promise<LoginResult<AuthCollectionSlug>> => {
    const { collection, config, email, password, username } = data

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
      setPayloadAuthCookie({
        authConfig,
        cookiePrefix: payload.config.cookiePrefix,
        token: result.token,
      })
    }

    return result
  })
