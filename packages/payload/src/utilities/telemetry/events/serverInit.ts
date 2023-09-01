import type { Payload } from '../../../payload'

import { sendEvent } from '..'

export type ServerInitEvent = {
  type: 'server-init'
}

export const serverInit = (payload: Payload): void => {
  sendEvent({
    event: {
      type: 'server-init',
    },
    payload,
  })
}
