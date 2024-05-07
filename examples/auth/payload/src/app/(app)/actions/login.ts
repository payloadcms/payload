'use server'
import type { User } from '@/payload-types'

import { getPayloadHMR } from '@payloadcms/next/utilities'
import { revalidateTag } from 'next/cache'
import { cookies as getCookies } from 'next/headers'

import config from '../../../payload.config'

export const login = async (data: { email: string; password: string }): Promise<User | null> => {
  const cookies = getCookies()
  const payload = await getPayloadHMR({ config })

  const { token, user } = await payload.login({
    collection: 'users',
    data: {
      email: data.email,
      password: data.password,
    },
  })

  if (token) cookies.set('payload-token', token)
  else cookies.delete('payload-token')

  revalidateTag('payload-user')

  return user
}
