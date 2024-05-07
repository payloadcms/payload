'use server'
import type { User } from '@/payload-types'

import { getPayloadHMR } from '@payloadcms/next/utilities'
import { headers } from 'next/headers'
import { cache } from 'react'

import config from '../../../payload.config'

// This function is memoized via the `cache` function and gets invalidated when:
//   - A new server-side request is made, i.e. page load or route navigation
//   - This function is called with a _user_ that is _different_ than any previously provided args
//      - In these cases, the incoming user is returned and a new request is not made
//   - This function is called with a _key_ that is _different_ than any previously provided args
// When invalidated, all instances of `getUser()` will re-run with the newly cached result
export const getUser = cache(
  async (incomingUser?: User | null, key?: string): Promise<User | null> => {
    if (incomingUser !== undefined) return incomingUser
    const payload = await getPayloadHMR({ config })
    const { user } = await payload.auth({ headers: headers() })
    return user
  },
)
