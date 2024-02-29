import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { payloadFavicon, payloadOgImage } from '@payloadcms/ui/assets'

export const meta = async (args: {
  config: SanitizedConfig
  description?: string
  keywords?: string
  title: string
}): Promise<Metadata> => {
  const { config, description = '', keywords = 'CMS, Admin, Dashboard', title } = args

  const titleSuffix = config.admin.meta?.titleSuffix ?? '- Payload'
  const favicon = config?.admin?.meta?.favicon ?? payloadFavicon?.src
  const ogImage = config.admin?.meta?.ogImage ?? payloadOgImage?.src

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
      type: 'website',
      description,
      images: [
        {
          alt: `${title} ${titleSuffix}`,
          height: 630,
          url: ogImage,
          width: 1200,
        },
      ],
      title: `${title} ${titleSuffix}`,
    },
    title: `${title} ${titleSuffix}`,
  }
}
