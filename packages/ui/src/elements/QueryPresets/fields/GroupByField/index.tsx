'use client'
import type { TextFieldClientComponent } from 'payload'

import { toWords } from 'payload/shared'
import React from 'react'

import { FieldLabel } from '../../../../fields/FieldLabel/index.js'
import { useField } from '../../../../forms/useField/index.js'
import { Pill } from '../../../Pill/index.js'
import './index.scss'

export const QueryPresetsGroupByField: TextFieldClientComponent = ({
  field: { label, required },
}) => {
  const { path, value } = useField()

  const renderGroupBy = (groupByValue: string) => {
    if (!groupByValue) {
      return 'No group by selected'
    }

    const isDescending = groupByValue.startsWith('-')
    const fieldName = isDescending ? groupByValue.slice(1) : groupByValue
    const direction = isDescending ? 'descending' : 'ascending'

    return (
      <Pill pillStyle="always-white" size="small">
        <b>{toWords(fieldName)}</b> ({direction})
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
