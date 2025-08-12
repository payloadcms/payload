'use client'
import type { ColumnPreference, JSONFieldClientComponent } from 'payload'

import { toWords, transformColumnsToSearchParams } from 'payload/shared'
import React from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { Pill } from '../../../Pill/index.js'
import './index.scss'

export const QueryPresetsColumnField: JSONFieldClientComponent = ({
  field: { label, required },
}) => {
  const { path, value } = useField()

  return (
    <div className="field-type query-preset-columns-field">
      <FieldLabel as="h3" label={label} path={path} required={required} />
      <div className="value-wrapper">
        {value
          ? transformColumnsToSearchParams(value as ColumnPreference[]).map((column, i) => {
              const isColumnActive = !column.startsWith('-')

              return (
                <Pill
                  key={i}
                  pillStyle={isColumnActive ? 'always-white' : 'light-gray'}
                  size="small"
                >
                  {toWords(column)}
                </Pill>
              )
            })
          : 'No columns selected'}
      </div>
    </div>
  )
}
