import type { SharpCollectionConfig } from '@payloadcms/transformer-sharp'

/**
 * Sharp options shared by the storage adapter suites: a 200x200 centered resize of the
 * original plus `square` and `sixteenByNineMedium` variants.
 */
export const storageMediaSharpOptions: SharpCollectionConfig = {
  resizeOptions: {
    height: 200,
    position: 'center',
    width: 200,
  },
  variants: [
    { name: 'square', crop: 'center', height: 400, width: 400 },
    { name: 'sixteenByNineMedium', crop: 'center', height: 450, width: 900 },
  ],
}
