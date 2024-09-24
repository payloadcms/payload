'use client'
import type { ClientCollectionConfig } from 'payload'

import { useState } from 'react'

import { useConfig } from '../../providers/Config/index.js'

export const useRelatedCollections = (relationTo: string | string[]): ClientCollectionConfig[] => {
  const { config } = useConfig()

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
