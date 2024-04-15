import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { payloadFavicon } from '@payloadcms/ui/assets'
import QueryString from 'qs'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Payload is a headless CMS and application framework built with TypeScript, Node.js, React and MongoDB',
  images: [
    {
      url: `/api/og`,
    },
  ],
  siteName: 'Payload App',
  title: 'Payload App',
}

export const meta = (args: {
  config: SanitizedConfig
  description?: string
  keywords?: string
  leader?: string
  title: string
}): Metadata => {
  const { config, description, keywords = 'CMS, Admin, Dashboard', leader, title } = args

  const titleSuffix = config.admin.meta?.titleSuffix ?? '- Payload'
  const favicon = config?.admin?.meta?.favicon ?? payloadFavicon?.src
  const ogImage = config.admin?.meta?.ogImage

  return {
    description,
    icons: [
      {
        type: 'image/svg',
        rel: 'icon',
        url: favicon,
      },
    ],
    keywords,
    metadataBase: new URL(
      config?.serverURL ||
        process.env.PAYLOAD_PUBLIC_SERVER_URL ||
        `http://localhost:${process.env.PORT || 3000}`,
    ),
    openGraph: {
      ...defaultOpenGraph,
      description,
      images: ogImage || [
        {
          alt: `${title} ${titleSuffix}`,
          height: 630,
          url: `/api/og${QueryString.stringify({
            leader,
            title: `${title} ${titleSuffix}`,
          })}`,
          width: 1200,
        },
      ],
      title: `${title} ${titleSuffix}`,
    },
    title: `${title} ${titleSuffix}`,
  }
}
