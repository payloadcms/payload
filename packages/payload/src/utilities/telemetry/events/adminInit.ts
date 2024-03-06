import type { Payload } from '../../../index.d.ts'
import type { User } from '../../../auth/types.d.ts'

import { sendEvent } from '../index.js'
import { oneWayHash } from '../oneWayHash.js'

export type AdminInitEvent = {
  domainID?: string
  type: 'admin-init'
  userID?: string
}

type Args = {
  headers: Request['headers']
  payload: Payload
  user: User | null
}
export const adminInit = ({ headers, payload, user }: Args): void => {
  const host = headers.get('host')

  let domainID: string
  let userID: string

  if (host) {
    domainID = oneWayHash(host, payload.secret)
  }

  if (user?.id) {
    userID = oneWayHash(String(user.id), payload.secret)
  }

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  sendEvent({
    event: {
      domainID,
      type: 'admin-init',
      userID,
    },
    payload,
  })
}
