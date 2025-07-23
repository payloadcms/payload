'use server'

import type { CollectionSlug } from 'payload'

import { getPayload } from 'payload'

import { setPayloadAuthCookie } from '../utilities/setPayloadAuthCookie.js'

type LoginWithEmail = {
  collection: CollectionSlug
  config: any
  email: string
  password: string
  username?: never
}

type LoginWithUsername = {
  collection: CollectionSlug
  config: any
  email?: never
  password: string
  username: string
}
type LoginArgs = LoginWithEmail | LoginWithUsername

export async function login({ collection, config, email, password, username }: LoginArgs): Promise<{
  token?: string
  user: any
}> {
  const payload = await getPayload({ config, cron: true })

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
    await setPayloadAuthCookie({
      authConfig,
      cookiePrefix: payload.config.cookiePrefix,
      token: result.token,
    })
  }

  if ('removeTokenFromResponses' in config && config.removeTokenFromResponses) {
    delete result.token
  }

  return result
}
