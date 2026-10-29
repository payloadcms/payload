/* eslint-disable no-console -- Console is the Workers-compatible log destination. */
import type { PayloadLogger } from 'payload'

import pino from 'pino/browser.js'

/** Use Pino's console implementation so logging does not require Node filesystem streams. */
export const createCloudflareLogger = ({
  enabled = true,
  level = 'info',
}: {
  enabled?: boolean
  level?: string
}): PayloadLogger =>
  pino({
    browser: {
      serialize: true,
      write: {
        debug: (record) => console.debug(JSON.stringify(record)),
        error: (record) => console.error(JSON.stringify(record)),
        fatal: (record) => console.error(JSON.stringify(record)),
        info: (record) => console.info(JSON.stringify(record)),
        trace: (record) => console.trace(JSON.stringify(record)),
        warn: (record) => console.warn(JSON.stringify(record)),
      },
    },
    enabled,
    level,
    serializers: { err: pino.stdSerializers.err },
  })
