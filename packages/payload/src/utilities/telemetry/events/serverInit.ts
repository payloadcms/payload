import type { Payload } from '../../../index.js'

import { sendTelemetryEvent } from '../index.js'

export type ServerInitEvent = {
  type: 'server-init'
}

export const serverInit = (payload: Payload): void => {
  void sendTelemetryEvent({
    event: {
      type: 'server-init',
    },
    payload,
  })
}
