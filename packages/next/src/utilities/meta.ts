import type { Metadata } from 'next'
import type { Icon } from 'next/dist/lib/metadata/types/metadata-types.js'
import type { MetaConfig, SanitizedConfig } from 'payload/config'

import { payloadFaviconDark, payloadFaviconLight } from '@payloadcms/ui/assets'
import { defaults } from 'payload/config'
import QueryString from 'qs'

export const meta = async (
  args: MetaConfig & { config: SanitizedConfig; serverURL?: string },
): Promise<any> => {
  const mergedMeta = {
    ...args.config.admin.meta,
    ...args,
  }

  const { description, icons: customIcons, keywords, serverURL, title, titleSuffix } = mergedMeta

  const openGraph = {
    ...(args.config.admin.meta.openGraph || {}),
    ...(args.openGraph || {}),
  }

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

  let icons = (customIcons as Metadata['icons']) ?? payloadIcons // TODO: fix this type assertion

  if (customIcons && typeof customIcons === 'object' && Array.isArray(customIcons)) {
    icons = payloadIcons.concat(customIcons as Icon[]) // TODO: fix this type assertion
  }

  const metaTitle = `${title} ${titleSuffix}`

  const ogTitle = `${typeof openGraph?.title === 'string' ? openGraph.title : title} ${titleSuffix}`

  const mergedOpenGraph: Metadata['openGraph'] = {
    ...(defaults.admin.meta.openGraph || {}),
    description,
    images: [
      {
        alt: ogTitle,
        height: 630,
        url: `/api/og${QueryString.stringify(
          {
            description: openGraph?.description,
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
    ...(openGraph || {}),
  }

  return Promise.resolve({
    description,
    icons,
    keywords,
    metadataBase: new URL(
      serverURL ||
        process.env.PAYLOAD_PUBLIC_SERVER_URL ||
        `http://localhost:${process.env.PORT || 3000}`,
    ),
    openGraph: mergedOpenGraph,
    title: metaTitle,
  })
}
