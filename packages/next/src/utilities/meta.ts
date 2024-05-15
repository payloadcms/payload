import type { Metadata } from 'next'
import type { Icon } from 'next/dist/lib/metadata/types/metadata-types.js'
import type { SanitizedConfig } from 'payload/types'

import { payloadFaviconDark, payloadFaviconLight } from '@payloadcms/ui/assets'
import { defaults } from 'payload/config'
import QueryString from 'qs'

export const meta = (args: {
  config: SanitizedConfig
  description?: string
  keywords?: string
  leader?: string
  openGraph?: Metadata['openGraph']
  title: string
}): Metadata => {
  const {
    config,
    description,
    keywords = 'CMS, Admin, Dashboard',
    leader,
    openGraph: openGraphFromProps,
    title,
  } = args

  const titleSuffix = config.admin.meta?.titleSuffix ?? '- Payload'

  const customIcons = config.admin.meta.icons as Metadata['icons']

  const payloadIcons: Icon[] = [
    {
      type: 'image/png',
      rel: 'icon',
      sizes: '32x32',
      url: payloadFaviconDark?.src,
    },
    {
      type: 'image/png',
      media: '(prefers-color-scheme: dark)',
      rel: 'icon',
      sizes: '32x32',
      url: payloadFaviconLight?.src,
    },
  ]

  let icons = customIcons ?? payloadIcons

  if (customIcons && typeof customIcons === 'object' && Array.isArray(customIcons)) {
    icons = payloadIcons.concat(customIcons)
  }

  const ogTitle = `${typeof openGraphFromProps?.title === 'string' ? openGraphFromProps.title : title} ${titleSuffix}`

  const openGraph: Metadata['openGraph'] = {
    ...(defaults.admin.meta.openGraph || {}),
    description,
    images: [
      {
        alt: ogTitle,
        height: 630,
        url: `/api/og${QueryString.stringify(
          {
            leader,
            title: ogTitle,
          },
          {
            addQueryPrefix: true,
          },
        )}`,
        width: 1200,
      },
    ],
    title: ogTitle,
    ...(openGraphFromProps || {}),
  }

  return {
    description,
    icons,
    keywords,
    metadataBase: new URL(
      config?.serverURL ||
        process.env.PAYLOAD_PUBLIC_SERVER_URL ||
        `http://localhost:${process.env.PORT || 3000}`,
    ),
    openGraph,
    title: `${title} ${titleSuffix}`,
  }
}
