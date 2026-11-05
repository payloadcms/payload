import type { Viewport } from 'next'

import { isIPhoneUserAgent } from '@payloadcms/ui/layouts'
import { headers } from 'next/headers.js'

export const getNextViewport = (userAgent?: string): Viewport => ({
  initialScale: 1,
  ...(isIPhoneUserAgent(userAgent) ? { maximumScale: 1 } : {}),
  width: 'device-width',
})

export const generateViewport = async (): Promise<Viewport> => {
  const headersList = await headers()

  return getNextViewport(headersList.get('user-agent') ?? undefined)
}
