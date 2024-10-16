/* eslint-disable no-restricted-exports */
'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error.js'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: { digest?: string } & Error }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <html lang="en-US">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        {/* @ts-expect-error types repo */}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
