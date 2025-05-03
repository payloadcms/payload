import type { Response } from 'express'
import type { Payload } from 'payload'
import type { Config as PayloadConfig } from 'payload/config'
import APIError from 'payload/dist/errors/APIError'

import type { PasswordProtectionOptions } from '../types'
import getCookiePrefix from './getCookiePrefix'

interface Args {
  config: PayloadConfig
  payload: Payload
  options: PasswordProtectionOptions
  collection: string
  password: string
  id: string
  res: Response
}

const validatePassword = async ({
  config,
  payload,
  options,
  collection,
  password,
  id,
  res,
}: Args): Promise<void> => {
  const doc = await payload.findByID({
    id,
    collection,
  })

  if (doc[options.passwordFieldName] === password) {
    const expires = new Date()
    expires.setSeconds(expires.getSeconds() + options.expiration || 7200)

    const cookiePrefix = getCookiePrefix(config.cookiePrefix || '', collection)

    const cookieOptions = {
      path: '/',
      httpOnly: true,
      expires,
      domain: undefined,
    }

    res.cookie(`${cookiePrefix}-${id}`, password, cookieOptions)
    return
  }

  throw new APIError('The password provided is incorrect.', 400)
}

export default validatePassword
