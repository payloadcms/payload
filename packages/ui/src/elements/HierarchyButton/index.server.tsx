import type { Payload } from 'payload'

import React from 'react'

import { FolderIcon } from '../../icons/Folder/index.js'
import { RenderServerComponent } from '../RenderServerComponent/index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { HierarchyButtonClient } from '../../exports/client/index.js'

export type HierarchyButtonServerProps = {
  fieldName: string
  hasMany?: boolean
  hierarchyCollectionSlug: string
  payload: Payload
}

export const HierarchyButton: React.FC<HierarchyButtonServerProps> = ({
  fieldName,
  hasMany,
  hierarchyCollectionSlug,
  payload,
}) => {
  const hierarchyCollectionConfig = payload.config.collections.find(
    (c) => c.slug === hierarchyCollectionSlug,
  )
  const hierarchyConfig =
    hierarchyCollectionConfig?.hierarchy && typeof hierarchyCollectionConfig.hierarchy === 'object'
      ? hierarchyCollectionConfig.hierarchy
      : undefined
  const IconComponent = hierarchyConfig?.admin.components.Icon

  // Render the custom icon if provided, otherwise use FolderIcon directly
  // Important: Must render the icon here on server to avoid hydration mismatch
  // For default FolderIcon path, render directly to avoid import map requirement
  const isDefaultFolderIcon = !IconComponent || IconComponent === '@payloadcms/ui#FolderIcon'
  const renderedIcon = isDefaultFolderIcon ? (
    <FolderIcon color="muted" />
  ) : (
    RenderServerComponent({
      Component: IconComponent,
      importMap: payload.importMap,
      key: `hierarchy-button-icon-${hierarchyCollectionSlug}`,
    })
  )

  return (
    <HierarchyButtonClient
      fieldName={fieldName}
      hasMany={hasMany}
      hierarchyCollectionSlug={hierarchyCollectionSlug}
      Icon={renderedIcon}
    />
  )
}
