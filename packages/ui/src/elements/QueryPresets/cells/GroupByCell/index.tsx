import type { DefaultCellComponentProps } from 'payload'

import { toWords } from 'payload/shared'
import React, { useMemo } from 'react'

import { useAuth } from '../../../../providers/Auth/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../../../utilities/reduceFieldsToOptions.js'

export const QueryPresetsGroupByCell: React.FC<DefaultCellComponentProps> = ({
  cellData,
  rowData,
}) => {
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const { config } = useConfig()

  // Get the related collection from the row data
  const relatedCollection = rowData?.relatedCollection as string

  // Get the collection config for the related collection
  const collectionConfig = useMemo(() => {
    if (!relatedCollection) {
      return null
    }

    return config.collections?.find((col) => col.slug === relatedCollection)
  }, [relatedCollection, config.collections])

  // Reduce fields to options to get proper labels
  const reducedFields = useMemo(() => {
    if (!collectionConfig) {
      return []
    }

    const fieldPermissions = permissions?.collections?.[relatedCollection]?.fields

    return reduceFieldsToOptions({
      fieldPermissions,
      fields: collectionConfig.fields,
      i18n,
    })
  }, [collectionConfig, permissions, relatedCollection, i18n])

  if (!cellData || typeof cellData !== 'string') {
    return <div>No group by selected</div>
  }

  const isDescending = cellData.startsWith('-')
  const fieldName = isDescending ? cellData.slice(1) : cellData
  const direction = isDescending ? 'descending' : 'ascending'

  // Find the field option to get the proper label
  const fieldOption = reducedFields.find((field) => field.value === fieldName)
  const displayLabel = fieldOption?.label || toWords(fieldName)

  return (
    <div>
      {displayLabel} ({direction})
    </div>
  )
}
