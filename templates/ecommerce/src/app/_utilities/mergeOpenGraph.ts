import type { Metadata } from 'next'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  siteName: 'Payload CMS',
  title: 'Payload CMS',
  description:
    'Payload is a headless CMS and application framework built with TypeScript, Node.js, React and MongoDB',
  images: [
    {
      url: '/images/og-image.jpg',
    },
  ],
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
