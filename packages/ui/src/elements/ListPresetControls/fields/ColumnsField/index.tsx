'use client'
import type { ColumnPreference, JSONFieldClientComponent } from 'payload'

import { toWords, transformColumnsToSearchParams } from 'payload/shared'
import React from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'

export const ListPresetsColumnsField: JSONFieldClientComponent = ({
  field: { label, required },
  path,
}) => {
  const { value } = useField({ path })

  return (
    <div>
      <FieldLabel label={label} path={path} required={required} />
      {value
        ? transformColumnsToSearchParams(value as ColumnPreference[])
            .map((column) => toWords(column))
            .join(', ')
        : 'No columns selected'}
    </div>
  )
}
