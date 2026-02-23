import type { Payload } from 'payload'

import { getFromImportMap } from 'payload/shared'
import React from 'react'

import { FolderIcon } from '../../icons/Folder/index.js'
import { HierarchyButtonClient } from './index.js'

export type HierarchyButtonServerProps = {
  collectionSlug: string
  fieldName: string
  hasMany?: boolean
  parentFieldName?: string
  payload: Payload
}

export const HierarchyButton: React.FC<HierarchyButtonServerProps> = ({
  collectionSlug,
  fieldName,
  hasMany,
  parentFieldName,
  payload,
}) => {
  const hierarchyCollectionConfig = payload.config.collections.find(
    (c) => c.slug === collectionSlug,
  )
  const hierarchyConfig =
    hierarchyCollectionConfig?.hierarchy && typeof hierarchyCollectionConfig.hierarchy === 'object'
      ? hierarchyCollectionConfig.hierarchy
      : undefined
  const iconPath = hierarchyConfig?.admin?.components?.Icon

  let Icon: React.ComponentType = FolderIcon

  if (iconPath) {
    const ResolvedIcon = getFromImportMap<React.ComponentType>({
      importMap: payload.importMap,
      PayloadComponent: iconPath,
      schemaPath: '',
    })

    if (ResolvedIcon) {
      Icon = ResolvedIcon
    }
  }

  return (
    <HierarchyButtonClient
      collectionSlug={collectionSlug}
      fieldName={fieldName}
      hasMany={hasMany}
      Icon={<Icon />}
      parentFieldName={parentFieldName}
    />
  )
}
