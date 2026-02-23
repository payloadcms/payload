import type { RelationshipFieldServerComponent } from 'payload'

import { getFromImportMap } from 'payload/shared'
import React from 'react'

import { TagIcon } from '../../icons/Tag/index.js'
import { HierarchyFieldClient } from './index.client.js'

export const HierarchyField: RelationshipFieldServerComponent = (props) => {
  const { clientField, field, payload } = props

  const hierarchySlug = Array.isArray(field.relationTo) ? field.relationTo[0] : field.relationTo
  const hierarchyCollectionConfig = payload.config.collections.find((c) => c.slug === hierarchySlug)
  const hierarchyConfig =
    hierarchyCollectionConfig?.hierarchy && typeof hierarchyCollectionConfig.hierarchy === 'object'
      ? hierarchyCollectionConfig.hierarchy
      : undefined
  const iconPath = hierarchyConfig?.admin?.components?.Icon
  const parentFieldName = hierarchyConfig?.parentFieldName

  let Icon: React.ComponentType = TagIcon

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
    <HierarchyFieldClient
      field={clientField}
      Icon={<Icon />}
      parentFieldName={parentFieldName}
      path={props.path}
      permissions={props.permissions}
      readOnly={props.readOnly}
      schemaPath={props.schemaPath}
    />
  )
}
