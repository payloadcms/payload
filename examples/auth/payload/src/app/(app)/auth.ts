import type { User } from '@payload-types'
import type { SanitizedPermissions } from 'payload'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { cache } from 'react'

export const auth = cache(async function (): Promise<{
  permissions: null | SanitizedPermissions
  user: null | User
}> {
  const config = await configPromise
  const payload = await getPayload({ config })
  const headers = await getHeaders()

  try {
    const { permissions, user } = await payload.auth({
      headers,
    })

    return { permissions, user }
  } catch (e) {
    payload.logger.error(e)
  }

  return { permissions: null, user: null }
})
