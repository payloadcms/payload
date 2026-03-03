import type { RelationshipFieldServerComponent } from 'payload'

import React from 'react'

import { RenderServerComponent } from '../RenderServerComponent/index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { HierarchyFieldClient } from '../../exports/client/index.js'

export const HierarchyField: RelationshipFieldServerComponent = (props) => {
  const { clientField, field, payload } = props

  const hierarchySlug = Array.isArray(field.relationTo) ? field.relationTo[0] : field.relationTo
  const hierarchyCollectionConfig = payload.config.collections.find((c) => c.slug === hierarchySlug)
  const hierarchyConfig =
    hierarchyCollectionConfig?.hierarchy && typeof hierarchyCollectionConfig.hierarchy === 'object'
      ? hierarchyCollectionConfig.hierarchy
      : undefined
  const Icon = hierarchyConfig?.admin.components.Icon

  const renderedIcon = RenderServerComponent({
    Component: Icon,
    importMap: payload.importMap,
    key: `hierarchy-field-icon-${hierarchySlug}`,
  })

  return (
    <HierarchyFieldClient
      field={clientField}
      Icon={renderedIcon}
      path={props.path}
      permissions={props.permissions}
      readOnly={props.readOnly}
      schemaPath={props.schemaPath}
    />
  )
}
