import type { MetaConfig } from 'payload'

import * as qs from 'qs-esm'

import { payloadFaviconDark, payloadFaviconLight, staticOGImage } from '../assets/index.js'

// Replicates the Icon type structure from next/dist/lib/metadata/types/metadata-types
type Icon = {
  media?: string
  rel?: string
  sizes?: string
  type?: string
  url: string
}

const appendTitleSuffix = (
  title: MetaConfig['title'],
  suffix: string | undefined,
): MetaConfig['title'] => {
  if (!suffix || !title) {
    return title ?? undefined
  }
  if (typeof title === 'string') {
    return `${title} ${suffix}`
  }

  if ('default' in title) {
    return { default: `${title.default} ${suffix}`, template: `${title.template} ${suffix}` }
  }

  if ('template' in title) {
    return {
      absolute: `${title.absolute} ${suffix}`,
      template: title.template !== null ? `${title.template} ${suffix}` : null,
    }
  }

  return { absolute: `${title.absolute} ${suffix}` }
}

const getTitleString = (title: MetaConfig['title']): string | undefined => {
  if (!title) {
    return undefined
  }
  if (typeof title === 'string') {
    return title
  }
  if ('absolute' in title) {
    return title.absolute
  }
  return title.default
}

const defaultOpenGraph: MetaConfig['openGraph'] = {
  description:
    'Payload is a headless CMS and application framework built with TypeScript, Node.js, and React.',
  siteName: 'Payload App',
  title: 'Payload App',
}

export const formatMetadata = async (
  args: { serverURL?: string } & MetaConfig,
): Promise<MetaConfig> => {
  const { defaultOGImageType, serverURL, titleSuffix, ...rest } = args

  /**
   * @todo find a way to remove the type assertion here.
   * It is a result of needing to `DeepCopy` the `MetaConfig` type from Payload.
   * This is required for the `DeepRequired` from `Config` to `SanitizedConfig`.
   */
  const incomingMetadata = rest as MetaConfig

  const faviconDark = payloadFaviconDark as { src: string } | string
  const faviconLight = payloadFaviconLight as { src: string } | string
  const ogImage = staticOGImage as { src: string } | string

  const icons: MetaConfig['icons'] =
    incomingMetadata.icons ||
    ([
      {
        type: 'image/png',
        rel: 'icon',
        sizes: '32x32',
        url: typeof faviconDark === 'object' ? faviconDark.src : faviconDark,
      },
      {
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
        rel: 'icon',
        sizes: '32x32',
        url: typeof faviconLight === 'object' ? faviconLight.src : faviconLight,
      },
    ] satisfies Array<Icon>)

  const metaTitle: MetaConfig['title'] = appendTitleSuffix(incomingMetadata.title, titleSuffix)

  const titleStringForOg: string | undefined =
    typeof incomingMetadata.openGraph?.title === 'string'
      ? incomingMetadata.openGraph.title
      : getTitleString(incomingMetadata.title)

  const ogTitle = [titleStringForOg, titleSuffix].filter(Boolean).join(' ')

  const mergedOpenGraph: MetaConfig['openGraph'] = {
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
              url: typeof ogImage === 'object' ? ogImage.src : ogImage,
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
