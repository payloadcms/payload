'use server'
import type { User } from '@/payload-types'

import { getPayloadHMR } from '@payloadcms/next/utilities'
import { revalidateTag } from 'next/cache'

import config from '../../../payload.config'

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

  revalidateTag('payload-user')

  return user
}
