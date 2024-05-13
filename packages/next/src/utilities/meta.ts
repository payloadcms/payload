import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { payloadFaviconDark, payloadFaviconLight, payloadOgImage } from '@payloadcms/ui/assets'

export const meta = async (args: {
  config: SanitizedConfig
  description?: string
  keywords?: string
  title: string
}): Promise<Metadata> => {
  const { config, description = '', keywords = 'CMS, Admin, Dashboard', title } = args

  const titleSuffix = config.admin.meta?.titleSuffix ?? '- Payload'

  const customFavicon = config.admin.meta?.favicon
  const customFaviconFiletype = customFavicon?.split('.').pop()
  const customFaviconMediaType = `image/${customFaviconFiletype}`

  const favicon = customFavicon ?? payloadFaviconLight?.src
  const ogImage = config.admin?.meta?.ogImage ?? payloadOgImage?.src

  return Promise.resolve({
    description,
    icons: [
      ...(customFavicon
        ? [
            {
              type: customFaviconMediaType,
              rel: 'icon',
              url: favicon,
            },
          ]
        : [
            {
              type: 'image/png',
              rel: 'icon',
              url: payloadFaviconDark?.src,
            },
            {
              type: 'image/png',
              media: '(prefers-color-scheme: dark)',
              rel: 'icon',
              url: payloadFaviconLight?.src,
            },
          ]),
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
  })
}
