import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { payloadOgImage } from '@payloadcms/ui'

export const meta = async (args: {
  config: SanitizedConfig
  description?: string
  keywords?: string
  title: string
}): Promise<Metadata> => {
  const { config, description = '', keywords = 'CMS, Admin, Dashboard', title } = args

  const titleSuffix = config.admin.meta?.titleSuffix ?? '- Payload'
  const ogImage = config.admin.meta.ogImage ?? payloadOgImage.src

  return {
    description,
    keywords,
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
