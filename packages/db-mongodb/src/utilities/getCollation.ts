import type { CollationOptions } from 'mongodb'

import type { MongooseAdapter } from '../index.js'

export const getCollation = ({
  adapter,
  locale,
}: {
  adapter: MongooseAdapter
  locale?: string
}): CollationOptions | undefined => {
  if (adapter.collation) {
    return {
      locale: locale && locale !== 'all' && locale !== '*' ? locale : 'en',
      ...adapter.collation,
    }
  }
}
