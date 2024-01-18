'use server'

import { getPayload } from 'payload'
import configPromise from 'payload-config'
import { cookies as nextCookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const loginAction = async (formData: FormData) => {
  const cookies = nextCookies()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const payload = await getPayload({
    config: configPromise,
  })

  const res = await payload.login({
    collection: 'users',
    data: {
      email,
      password,
    },
  })

  cookies.set('payload-token', res.token)

  redirect('/admin')
}
