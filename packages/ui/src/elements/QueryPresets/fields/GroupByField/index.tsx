'use client'
import type { TextFieldClientComponent } from 'payload'

import React, { useMemo } from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { GroupByBuilder } from '../../../GroupByBuilder/index.js'
import './index.scss'

export const QueryPresetsGroupByField: TextFieldClientComponent = ({
  field: { label, required },
}) => {
  const { path, setValue, value } = useField<string>()
  const relatedCollectionField = useField({ path: 'relatedCollection' })
  const relatedCollection = relatedCollectionField.value as string | undefined
  const { config } = useConfig()

  const collectionConfig = useMemo(() => {
    if (!relatedCollection) {
      return null
    }
    return config.collections?.find((col) => col.slug === relatedCollection)
  }, [relatedCollection, config.collections])

  const fields = collectionConfig?.fields ?? []

  if (!relatedCollection) {
    return (
      <div className="field-type query-preset-group-by-field">
        <FieldLabel as="h3" label={label} path={path} required={required} />
        <p className="query-preset-group-by-field__hint">
          Select the related collection to configure group by.
        </p>
      </div>
    )
  }

  return (
    <div className="field-type query-preset-group-by-field">
      <FieldLabel as="h3" label={label} path={path} required={required} />
      <GroupByBuilder
        collectionSlug={relatedCollection}
        fields={fields}
        onChange={(groupBy) => setValue(groupBy || null)}
        value={value ?? undefined}
      />
    </div>
  )
}
