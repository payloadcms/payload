import { useEffect, useState } from 'react'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../exports/types'

import { useConfig } from '../Config'

export const useCollectionGlobalConfigs = (
  entitySlug: string | string[],
  deps: any[] = [],
): (SanitizedCollectionConfig | SanitizedGlobalConfig)[] => {
  const config = useConfig()
  const [relatedEntities, setRelatedEntities] = useState<
    (SanitizedCollectionConfig | SanitizedGlobalConfig)[]
  >([])

  useEffect(() => {
    if (entitySlug) {
      const entitySlugs = Array.isArray(entitySlug) ? entitySlug : [entitySlug]
      const newRelatedEntities = entitySlugs.flatMap((slug) => {
        const collection = config.collections.find((collection) => collection.slug === slug)
        const global = config.globals.find((global) => global.slug === slug)

        return collection || global ? [collection || global] : []
      })

      setRelatedEntities(newRelatedEntities)
    } else {
      setRelatedEntities([])
    }
  }, [entitySlug, config.collections, config.globals, ...deps])

  return relatedEntities
}
