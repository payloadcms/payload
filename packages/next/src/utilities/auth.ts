import type { I18n } from '@payloadcms/translations'
import { getAuthenticatedUser, getAccessResults } from 'payload/auth'
import { PayloadRequest } from 'payload/types'
import { cache } from 'react'

export const auth = cache(
  async ({
    headers,

    cookies,
    i18n,
    partialReq,
  }: {
    headers: any
    cookies: Map<string, string>
    i18n: I18n
    partialReq: Partial<PayloadRequest>
  }) => {
    const user = await getAuthenticatedUser({
      headers,
      payload: partialReq.payload,
      cookies,
    })
    partialReq.user = user

    const permissions = await getAccessResults({
      req: partialReq as PayloadRequest,
    })

    return {
      user,
      permissions,
    }
  },
)
