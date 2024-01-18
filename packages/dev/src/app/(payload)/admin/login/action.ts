'use server'

import { getPayload } from 'payload'
import configPromise from 'payload-config'

export const loginAction = async (formData: FormData) => {
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

  console.log('res', res)
}
