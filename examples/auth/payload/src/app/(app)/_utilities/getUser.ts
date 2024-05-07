'use server'
import type { User } from '@/payload-types'

import { getPayloadHMR } from '@payloadcms/next/utilities'
import { unstable_cache } from 'next/cache'

import config from '../../../payload.config'

export const getUser = unstable_cache(
  async (headers: Headers): Promise<User | null> => {
    const payload = await getPayloadHMR({ config })
    const { user } = await payload.auth({ headers })
    return user
  },
  ['payload-user'],
)
