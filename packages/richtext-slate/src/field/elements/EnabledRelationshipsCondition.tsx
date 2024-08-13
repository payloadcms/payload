'use client'

import type { ClientCollectionConfig, ClientUser, VisibleEntities } from 'payload'

import { useAuth, useConfig, useEntityVisibility } from '@payloadcms/ui'
import * as React from 'react'

type Options = {
  uploads: boolean
  user: ClientUser
  visibleEntities: VisibleEntities
}

type FilteredCollectionsT = (
  collections: ClientCollectionConfig[],
  options?: Options,
) => ClientCollectionConfig[]

const filterRichTextCollections: FilteredCollectionsT = (collections, options) => {
  return collections.filter(({ slug, admin: { enableRichTextRelationship }, upload }) => {
    if (!options.visibleEntities.collections.includes(slug)) {
      return false
    }

    if (options?.uploads) {
      return enableRichTextRelationship && Boolean(upload) === true
    }

    return upload ? false : enableRichTextRelationship
  })
}

export const EnabledRelationshipsCondition: React.FC<any> = (props) => {
  const { children, uploads = false, ...rest } = props
  const {
    config: { collections },
  } = useConfig()
  const { user } = useAuth()
  const { visibleEntities } = useEntityVisibility()

  const [enabledCollectionSlugs] = React.useState(() =>
    filterRichTextCollections(collections, { uploads, user, visibleEntities }).map(
      ({ slug }) => slug,
    ),
  )

  if (!enabledCollectionSlugs.length) {
    return null
  }

  return React.cloneElement(children, { ...rest, enabledCollectionSlugs })
}
