'use server'
import { login } from '@payloadcms/next/auth'

import config from '../config.js'

type LoginArgs = {
  email: string
  password: string
}

export async function loginFunction({ email, password }: LoginArgs) {
  try {
    const result = await login({
      collection: 'users',
      config,
      email,
      password,
    })
  } catch (error) {
    throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
