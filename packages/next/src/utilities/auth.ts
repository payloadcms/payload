import type { Payload, PayloadRequest } from 'payload/types'

import { getAccessResults, getAuthenticatedUser, parseCookies } from 'payload/auth'

type Args = {
  headers: Request['headers']
  payload: Payload
}

export const auth = async ({ headers, payload }: Args) => {
  const cookies = parseCookies(headers)

  const user = await getAuthenticatedUser({
    cookies,
    headers,
    payload,
  })

  const permissions = await getAccessResults({
    req: {
      context: {},
      headers,
      i18n: undefined,
      payload,
      payloadAPI: 'REST',
      t: undefined,
      user,
    } as PayloadRequest,
  })

  return {
    cookies,
    permissions,
    user,
  }
}
