'use server'
import type { User } from '@/payload-types'

import { getPayloadHMR } from '@payloadcms/next/utilities'

import config from '../../../payload.config'
import { getUser } from './getUser'

export const login = async (data: { email: string; password: string }): Promise<User | null> => {
  const payload = await getPayloadHMR({ config })

  const { user } = await payload.login({
    collection: 'users',
    data: {
      email: data.email,
      password: data.password,
    },
  })

  // invalidate the cached user
  await getUser(user)

  return user
}
