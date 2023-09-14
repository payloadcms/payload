import type { CollectionConfig } from '../collections/config/types'

import APIError from './APIError'

class TimestampsRequired extends APIError {
  constructor(collection: CollectionConfig) {
    super(
      `Timestamps are required in the collection ${collection.slug} because you have opted in to Versions.`,
    )
  }
}

export default TimestampsRequired
