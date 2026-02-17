import type { RelationshipFieldServerComponent } from 'payload'

import { getFromImportMap } from 'payload/shared'
import React from 'react'

import { TagIcon } from '../../../icons/Tag/index.js'
import { TaxonomyFieldClient } from './index.client.js'

export const TaxonomyField: RelationshipFieldServerComponent = (props) => {
  const { clientField, field, payload } = props

  const taxonomySlug = Array.isArray(field.relationTo) ? field.relationTo[0] : field.relationTo
  const taxonomyCollectionConfig = payload.config.collections.find((c) => c.slug === taxonomySlug)
  const iconPath = taxonomyCollectionConfig?.taxonomy?.icon
  const parentFieldName = taxonomyCollectionConfig?.taxonomy?.parentFieldName

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
    <TaxonomyFieldClient
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
