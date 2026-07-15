import type { Viewport } from 'next'

import { RootLayout } from '@payloadcms/next/layouts'

export const generateViewport = async (): Promise<Viewport> => ({
	initialScale: 1,
	width: 'device-width',
})

export default RootLayout