import type { Metadata } from 'next'
import type { Icon } from 'next/dist/lib/metadata/types/metadata-types.js'
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

  const ogImage = config.admin?.meta?.ogImage ?? payloadOgImage?.src

  const customIcons = config.admin.meta.icons as Metadata['icons']

  let icons = customIcons ?? []

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

  if (customIcons && typeof customIcons === 'object' && Array.isArray(customIcons)) {
    icons = payloadIcons.concat(customIcons)
  }

  return Promise.resolve({
    description,
    icons,
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
