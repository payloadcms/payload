import type { Metadata } from 'next'
import type { Icon } from 'next/dist/lib/metadata/types/metadata-types.js'
import type { MetaConfig } from 'payload'

import { payloadFaviconDark, payloadFaviconLight, staticOGImage } from '@payloadcms/ui/assets'
import * as qs from 'qs-esm'

const defaultOpenGraph: Metadata['openGraph'] = {
  description:
    'Payload is a headless CMS and application framework built with TypeScript, Node.js, and React.',
  siteName: 'Payload App',
  title: 'Payload App',
}

export const generateMetadata = async (
  args: { serverURL: string } & MetaConfig,
): Promise<Metadata> => {
  const { defaultOGImageType, serverURL, titleSuffix, ...rest } = args

  /**
   * @todo find a way to remove the type assertion here.
   * It is a result of needing to `DeepCopy` the `MetaConfig` type from Payload.
   * This is required for the `DeepRequired` from `Config` to `SanitizedConfig`.
   */
  const incomingMetadata = rest as Metadata

  const icons: Metadata['icons'] =
    incomingMetadata.icons ||
    ([
      {
        type: 'image/png',
        rel: 'icon',
        sizes: '32x32',
        url: typeof payloadFaviconDark === 'object' ? payloadFaviconDark?.src : payloadFaviconDark,
      },
      {
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
        rel: 'icon',
        sizes: '32x32',
        url:
          typeof payloadFaviconLight === 'object' ? payloadFaviconLight?.src : payloadFaviconLight,
      },
    ] satisfies Array<Icon>)

  const metaTitle: Metadata['title'] = [incomingMetadata.title, titleSuffix]
    .filter(Boolean)
    .join(' ')

  const ogTitle = `${typeof incomingMetadata.openGraph?.title === 'string' ? incomingMetadata.openGraph.title : incomingMetadata.title} ${titleSuffix}`

  const mergedOpenGraph: Metadata['openGraph'] = {
    ...(defaultOpenGraph || {}),
    ...(defaultOGImageType === 'dynamic'
      ? {
          images: [
            {
              alt: ogTitle,
              height: 630,
              url: `/api/og${qs.stringify(
                {
                  description:
                    incomingMetadata.openGraph?.description || defaultOpenGraph.description,
                  title: ogTitle,
                },
                {
                  addQueryPrefix: true,
                },
              )}`,
              width: 1200,
            },
          ],
        }
      : {}),
    ...(defaultOGImageType === 'static'
      ? {
          images: [
            {
              alt: ogTitle,
              height: 480,
              url: typeof staticOGImage === 'object' ? staticOGImage?.src : staticOGImage,
              width: 640,
            },
          ],
        }
      : {}),
    title: ogTitle,
    ...(incomingMetadata.openGraph || {}),
  }

  return Promise.resolve({
    ...incomingMetadata,
    icons,
    metadataBase: new URL(
      serverURL ||
        process.env.PAYLOAD_PUBLIC_SERVER_URL ||
        `http://localhost:${process.env.PORT || 3000}`,
    ),
    openGraph: mergedOpenGraph,
    title: metaTitle,
  })
}
