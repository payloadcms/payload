import * as Sentry from '@sentry/nextjs'
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

const enabled = !!dsn

Sentry.init({
  dsn,
  enabled,
  skipOpenTelemetrySetup: true,
  tracesSampleRate: 1.0,
})

if (enabled) {
  // eslint-disable-next-line no-console
  console.log('Sentry inited')
}

export {}
