import * as Sentry from '@sentry/node'

export const captureException = (err: Error): void => {
  Sentry.captureException(err)
}
