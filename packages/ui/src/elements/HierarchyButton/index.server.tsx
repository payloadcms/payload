import type { Payload } from 'payload'

import React from 'react'

import { RenderServerComponent } from '../RenderServerComponent/index.js'
import { HierarchyButtonClient } from './index.js'

export type HierarchyButtonServerProps = {
  collectionSlug: string
  fieldName: string
  hasMany?: boolean
  payload: Payload
}

export const HierarchyButton: React.FC<HierarchyButtonServerProps> = ({
  collectionSlug,
  fieldName,
  hasMany,
  payload,
}) => {
  const hierarchyCollectionConfig = payload.config.collections.find(
    (c) => c.slug === collectionSlug,
  )
  const hierarchyConfig =
    hierarchyCollectionConfig?.hierarchy && typeof hierarchyCollectionConfig.hierarchy === 'object'
      ? hierarchyCollectionConfig.hierarchy
      : undefined
  const Icon = hierarchyConfig?.admin.components.Icon

  const renderedIcon = RenderServerComponent({
    Component: Icon,
    importMap: payload.importMap,
    key: `hierarchy-button-icon-${collectionSlug}`,
  })

  return (
    <HierarchyButtonClient
      collectionSlug={collectionSlug}
      fieldName={fieldName}
      hasMany={hasMany}
      Icon={renderedIcon}
    />
  )
}
