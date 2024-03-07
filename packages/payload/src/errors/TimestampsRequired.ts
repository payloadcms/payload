import type { CollectionConfig } from '../collections/config/types.js'

import APIError from './APIError.js'

class TimestampsRequired extends APIError {
  constructor(collection: CollectionConfig) {
    super(
      `Timestamps are required in the collection ${collection.slug} because you have opted in to Versions.`,
    )
  }
}

export default TimestampsRequired
