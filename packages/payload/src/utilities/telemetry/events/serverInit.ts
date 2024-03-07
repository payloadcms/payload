import type { Payload } from '../../../index.js'

import { sendEvent } from '../index.js'

export type ServerInitEvent = {
  type: 'server-init'
}

export const serverInit = (payload: Payload): void => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  sendEvent({
    event: {
      type: 'server-init',
    },
    payload,
  })
}
