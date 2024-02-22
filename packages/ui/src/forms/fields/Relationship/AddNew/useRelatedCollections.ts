import { useState } from 'react'

import type { ClientConfig, SanitizedCollectionConfig } from 'payload/types'

import { useConfig } from '../../../../providers/Config'

export const useRelatedCollections = (
  relationTo: string | string[],
): ClientConfig['collections'] => {
  const config = useConfig()

  const [relatedCollections] = useState(() => {
    if (relationTo) {
      const relations = typeof relationTo === 'string' ? [relationTo] : relationTo
      return relations.map((relation) =>
        config.collections.find((collection) => collection.slug === relation),
      )
    }
    return []
  })

  return relatedCollections
}
