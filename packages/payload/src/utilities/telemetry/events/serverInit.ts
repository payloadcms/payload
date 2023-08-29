import type { Payload } from '../../../payload.js'

import { sendEvent } from '../index.js'

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
