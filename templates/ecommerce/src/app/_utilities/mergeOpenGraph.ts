import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'An open-source e-commerce store built with Payload and Next.js.',
  images: [
    {
      url: 'https://payloadcms.com/images/og-image.jpg',
    },
  ],
  siteName: 'Payload E-Commerce Template',
  title: 'Payload E-Commerce Template',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
