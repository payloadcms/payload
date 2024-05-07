'use server'
import type { User } from '@/payload-types'

import { getPayloadHMR } from '@payloadcms/next/utilities'

import config from '../../../payload.config'
import { getUser } from './getUser'

export const updateUser = async (args: {
  data: Partial<User>
  id: string
}): Promise<User | null> => {
  const { id, data } = args

  const payload = await getPayloadHMR({ config })

  const user = await payload.update({
    id,
    collection: 'users',
    data,
  })

  // invalidate the cached user
  await getUser(user)

  return user
}
