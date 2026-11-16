import type { SharpCollectionConfig } from '@payloadcms/transformer-sharp'

import { sharpTransformer } from '@payloadcms/transformer-sharp'
import sharp from 'sharp'

/**
 * Sharp options for the generic `media` collection shared by suites that only need a
 * croppable, focal-point-aware upload with thumbnail/medium/large variants.
 */
const mediaSharpOptions: SharpCollectionConfig = {
  crop: true,
  focalPoint: true,
  variants: [
    { name: 'thumbnail', height: 200, width: 200 },
    { name: 'medium', height: 800, width: 800 },
    { name: 'large', height: 1200, width: 1200 },
  ],
}

export const mediaSharpTransformer = ({ mediaSlug }: { mediaSlug: string }) =>
  sharpTransformer({ collections: { [mediaSlug]: mediaSharpOptions }, sharp })
