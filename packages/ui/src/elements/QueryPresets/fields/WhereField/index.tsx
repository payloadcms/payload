'use client'
import type { JSONFieldClientComponent, Where } from 'payload'

import React from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { WhereBuilder } from '../../../WhereBuilder/index.js'
import './index.scss'

export const QueryPresetsWhereField: JSONFieldClientComponent = ({
  field: { label, required },
}) => {
  const { path, setValue, value } = useField<Where>()
  const relatedCollectionField = useField({ path: 'relatedCollection' })
  const relatedCollection = relatedCollectionField.value as string | undefined

  if (!relatedCollection) {
    return (
      <div className="field-type query-preset-where-field">
        <FieldLabel as="h3" label={label} path={path} required={required} />
        <p className="query-preset-where-field__hint">
          Select the related collection to configure filters.
        </p>
      </div>
    )
  }

  return (
    <div className="field-type query-preset-where-field">
      <FieldLabel as="h3" label={label} path={path} required={required} />
      <WhereBuilder
        collectionSlug={relatedCollection}
        onChange={(where) => setValue(where)}
        value={value ?? undefined}
      />
    </div>
  )
}
