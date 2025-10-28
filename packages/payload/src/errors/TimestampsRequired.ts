import type { CollectionConfig } from '../collections/config/types.js'

import { APIError } from './APIError.js'

export class TimestampsRequired extends APIError {
  constructor(collection: CollectionConfig) {
    super(
      `Timestamps are required in the collection ${collection.slug} because you have opted in to Versions.`,
    )

    // Ensure error name is not lost during swc minification when running next build
    this.name = 'TimestampsRequired'
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, TimestampsRequired.prototype)
  }
}
