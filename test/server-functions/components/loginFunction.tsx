'use server'
import { login } from '@payloadcms/next/server-functions'

import config from '../config.js'

type LoginArgs = {
  email: string
  password: string
}

export async function loginFunction({ email, password }: LoginArgs) {
  return await login({
    collection: 'users',
    config,
    email,
    password,
  })
}
