import { SanitizedConfig } from 'payload/types'
import payloadOgImage from '@payloadcms/ui/assets/og-image.png'
import { Metadata } from 'next'

export const meta = async (args: {
  description?: string
  keywords?: string
  title: string
  config: Promise<SanitizedConfig>
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
    title: `${title} ${titleSuffix}`,
    description,
    keywords,
    openGraph: {
      title: `${title} ${titleSuffix}`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} ${titleSuffix}`,
        },
      ],
      type: 'website',
    },
  }
}
