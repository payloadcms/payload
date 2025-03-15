'use client'
import type { ColumnPreference, JSONFieldClientComponent } from 'payload'

import { toWords, transformColumnsToSearchParams } from 'payload/shared'
import React from 'react'

import { Pill } from '../../../../elements/Pill/index.js'
import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import './index.scss'

export const ListPresetsColumnsField: JSONFieldClientComponent = ({
  field: { label, required },
  path,
}) => {
  const { value } = useField({ path })

  return (
    <div className="field-type list-preset-columns-field">
      <FieldLabel as="h3" label={label} path={path} required={required} />
      <div className="value-wrapper">
        {value
          ? transformColumnsToSearchParams(value as ColumnPreference[]).map((column, i) => (
              <Pill key={i} pillStyle="always-white">
                {toWords(column)}
              </Pill>
            ))
          : 'No columns selected'}
      </div>
    </div>
  )
}
