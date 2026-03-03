import type { Payload } from 'payload'

import React from 'react'

import { FolderIcon } from '../../icons/Folder/index.js'
import { RenderServerComponent } from '../RenderServerComponent/index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { HierarchyButtonClient } from '../../exports/client/index.js'

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
  const IconComponent = hierarchyConfig?.admin.components.Icon

  // Render the custom icon if provided, otherwise use FolderIcon directly
  // Important: Must render the icon here on server to avoid hydration mismatch
  const renderedIcon = IconComponent ? (
    RenderServerComponent({
      Component: IconComponent,
      importMap: payload.importMap,
      key: `hierarchy-button-icon-${collectionSlug}`,
    })
  ) : (
    <FolderIcon />
  )

  return (
    <HierarchyButtonClient
      collectionSlug={collectionSlug}
      fieldName={fieldName}
      hasMany={hasMany}
      Icon={renderedIcon}
    />
  )
}
