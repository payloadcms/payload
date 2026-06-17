'use client'
import type { TextFieldClientComponent } from 'payload'

import React, { useMemo } from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { GroupByControl } from '../../../GroupByControl/index.js'
import '../fields.css'

export const QueryPresetsGroupByField: TextFieldClientComponent = ({
  field: { label, required },
}) => {
  const { path, setValue, value } = useField<string>()
  const relatedCollectionField = useField({ path: 'relatedCollection' })
  const relatedCollection = relatedCollectionField.value as string | undefined
  const { getEntityConfig } = useConfig()

  const collectionConfig = useMemo(
    () => (relatedCollection ? getEntityConfig({ collectionSlug: relatedCollection }) : null),
    [relatedCollection, getEntityConfig],
  )

  if (!relatedCollection || !collectionConfig) {
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
      <GroupByControl
        collectionSlug={relatedCollection}
        fields={collectionConfig.fields}
        onChange={(groupBy) => setValue(groupBy || null)}
        value={value ?? ''}
      />
    </div>
  )
}
