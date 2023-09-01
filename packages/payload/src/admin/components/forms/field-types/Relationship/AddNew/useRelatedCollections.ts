import { useState } from 'react'

import type { SanitizedCollectionConfig } from '../../../../../../collections/config/types'

import { useConfig } from '../../../../utilities/Config'

export const useRelatedCollections = (
  relationTo: string | string[],
): SanitizedCollectionConfig[] => {
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
