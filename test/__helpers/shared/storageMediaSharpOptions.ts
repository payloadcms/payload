import type { SharpCollectionConfig } from '@payloadcms/transformer-sharp'

/**
 * Sharp options shared by the storage adapter suites: a 200x200 centered resize of the
 * original plus smaller variants so both are generated without enlargement.
 */
export const storageMediaSharpOptions: SharpCollectionConfig = {
  resizeOptions: {
    height: 200,
    position: 'center',
    width: 200,
  },
  variants: [
    { name: 'square', crop: 'center', height: 100, width: 100 },
    { name: 'sixteenByNineMedium', crop: 'center', height: 90, width: 160 },
  ],
}
