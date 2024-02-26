import type { I18n } from '@payloadcms/translations'
import type { PayloadRequest } from 'payload/types'

import { getAccessResults, getAuthenticatedUser } from 'payload/auth'
import { cache } from 'react'

export const auth = cache(
  async ({
    cookies,
    headers,
    partialReq,
  }: {
    cookies: Map<string, string>
    headers: Request['headers']
    i18n: I18n
    partialReq: Partial<PayloadRequest>
  }) => {
    const user = await getAuthenticatedUser({
      cookies,
      headers,
      payload: partialReq.payload,
    })
    partialReq.user = user

    const permissions = await getAccessResults({
      req: partialReq as PayloadRequest,
    })

    return {
      permissions,
      user,
    }
  },
)
