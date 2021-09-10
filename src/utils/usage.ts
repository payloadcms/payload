import * as Sentry from '@sentry/node'
import type { Primitive, Transaction } from '@sentry/types'
import os from 'os'

type SentryTags = { [key: string]: Primitive }

export const init = (): Transaction => {
  Sentry.init({
    dsn: 'https://139de3d0197f464082d5715a0c48a497@o589961.ingest.sentry.io/5739829',
    tracesSampleRate: 1.0,
  })

  Sentry.setTags({
    os_type: os.type(),
    os_platform: os.platform(),
    os_release: os.release(),
    node_version: process.version,
  })

  return Sentry.startTransaction({
    op: 'create-payload-app',
    name: 'New Project',
  })
}

export const setTags = (tags: SentryTags): void => {
  Sentry.setTags({ ...tags })
}

export const handleException = (e: unknown): void => {
  Sentry.captureException(e)
}
