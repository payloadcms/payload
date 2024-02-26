import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import payloadOgImage from '@payloadcms/ui/assets/og-image.png'

export const meta = async (args: {
  config: Promise<SanitizedConfig>
  description?: string
  keywords?: string
  title: string
}): Promise<Metadata> => {
  const {
    config: configPromise,
    description = '',
    keywords = 'CMS, Admin, Dashboard',
    title,
  } = args

  const config = await configPromise

  const titleSuffix = config.admin.meta?.titleSuffix ?? '- Payload'
  const ogImage = config.admin.meta.ogImage ?? '' // TODO: fallback to payloadOgImage once it can be imported

  return {
    description,
    keywords,
    openGraph: {
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
      type: 'website',
    },
    title: `${title} ${titleSuffix}`,
  }
}
