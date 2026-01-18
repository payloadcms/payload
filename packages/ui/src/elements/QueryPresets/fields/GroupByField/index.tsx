'use client'
import type { TextFieldClientComponent } from 'payload'

import { toWords } from 'payload/shared'
import React, { useMemo } from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { useAuth } from '../../../../providers/Auth/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { reduceFieldsToOptions } from '../../../../utilities/reduceFieldsToOptions.js'
import { Pill } from '../../../Pill/index.js'
import './index.scss'

export const QueryPresetsGroupByField: TextFieldClientComponent = ({
  field: { label, required },
}) => {
  const { path, value } = useField()
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const { config } = useConfig()

  // Get the relatedCollection from the document data
  const relatedCollectionField = useField({ path: 'relatedCollection' })
  const relatedCollection = relatedCollectionField.value as string

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

  const renderGroupBy = (groupByValue: string) => {
    if (!groupByValue) {
      return 'No group by selected'
    }

    const isDescending = groupByValue.startsWith('-')
    const fieldName = isDescending ? groupByValue.slice(1) : groupByValue
    const direction = isDescending ? 'descending' : 'ascending'

    // Find the field option to get the proper label
    const fieldOption = reducedFields.find((field) => field.value === fieldName)
    const displayLabel = fieldOption?.label || toWords(fieldName)

    return (
      <Pill pillStyle="always-white" size="small">
        <b>{displayLabel}</b> ({direction})
      </Pill>
    )
  }

  return (
    <div className="field-type query-preset-group-by-field">
      <FieldLabel as="h3" label={label} path={path} required={required} />
      <div className="value-wrapper">{renderGroupBy(value as string)}</div>
    </div>
  )
}
