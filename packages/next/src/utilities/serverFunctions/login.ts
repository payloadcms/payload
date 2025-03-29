'use server'

import type { CollectionSlug } from 'payload'

import { cookies as getCookies } from 'next/headers.js'
import { generatePayloadCookie, getPayload } from 'payload'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import config from '@/payload.config'
export async function login({
  collection,
  email,
  password,
  username,
}: {
  collection: CollectionSlug
  email?: string
  password: string
  username?: string
}): Promise<{
  token?: string
  user: any
}> {
  const payload = await getPayload({ config })

  const authConfig = payload.collections[collection]?.config.auth
  if (!authConfig) {
    throw new Error(`No auth config found for collection: ${collection}`)
  }

  const loginWithUsername = authConfig?.loginWithUsername ?? false

  if (loginWithUsername) {
    if (loginWithUsername.allowEmailLogin) {
      // if loginWithUsername and allowEmailLogin are true then we accept email or username.
      if (!email && !username) {
        throw new Error('Email or username is required.')
      }
    } else {
      // if loginWithUsername is true and allowEmailLogin is false, we only accept username.
      if (!username) {
        throw new Error('Username is required.')
      }
    }
  } else {
    // if loginWithUsername is false, we only accept email.
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

  try {
    const result = await payload.login({
      collection,
      data: loginData,
    })

    if (result.token) {
      const cookies = await getCookies()
      const cookiePrefix = payload.config.cookiePrefix || 'payload'
      const cookieExpiration = authConfig.tokenExpiration
        ? new Date(Date.now() + authConfig.tokenExpiration)
        : undefined

      const payloadCookie = generatePayloadCookie({
        collectionAuthConfig: authConfig,
        cookiePrefix,
        expires: cookieExpiration,
        returnCookieAsObject: true,
        token: result.token,
      })

      if (payloadCookie.value) {
        // must pass authConfig.cookies options: domain, sameSite and secure
        const cookieOptions = {
          domain: authConfig.cookies.domain,
          expires: payloadCookie.expires ? new Date(payloadCookie.expires) : undefined,
          httpOnly: true,
          sameSite: (authConfig.cookies.sameSite as any) || 'lax',
          secure: authConfig.cookies.secure || false,
        }

        cookies.set(payloadCookie.name, payloadCookie.value, cookieOptions)
      }
    }

    if ('removeTokenFromResponses' in config && config.removeTokenFromResponses) {
      delete result.token
    }

    return result
  } catch (e) {
    console.error('Login error:', e)
    throw new Error(`${e}`)
  }
}
