'use client'
import type { ClientField } from '@ruya.sa/payload'

import { ChevronIcon, FieldDiffLabel, useConfig, useTranslation } from '@ruya.sa/ui'
import { fieldIsArrayType, fieldIsBlockType } from '@ruya.sa/payload/shared'
import React, { useState } from 'react'

import './index.scss'
import { countChangedFields, countChangedFieldsInRows } from '../utilities/countChangedFields.js'

const baseClass = 'diff-collapser'

type Props = {
  hideGutter?: boolean
  initCollapsed?: boolean
  Label: React.ReactNode
  locales: string[] | undefined
  parentIsLocalized: boolean
  valueTo: unknown
} & (
  | {
      // fields collapser
      children: React.ReactNode
      field?: never
      fields: ClientField[]
      isIterable?: false
      valueFrom: unknown
    }
  | {
      // iterable collapser
      children: React.ReactNode
      field: ClientField
      fields?: never
      isIterable: true
      valueFrom?: unknown
    }
)

export const DiffCollapser: React.FC<Props> = ({
  children,
  field,
  fields,
  hideGutter = false,
  initCollapsed = false,
  isIterable = false,
  Label,
  locales,
  parentIsLocalized,
  valueFrom,
  valueTo,
}) => {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(initCollapsed)
  const { config } = useConfig()

  let changeCount = 0

  if (isIterable) {
    if (!fieldIsArrayType(field) && !fieldIsBlockType(field)) {
      throw new Error(
        'DiffCollapser: field must be an array or blocks field when isIterable is true',
      )
    }
    const valueFromRows = valueFrom ?? []
    const valueToRows = valueTo ?? []

    if (!Array.isArray(valueFromRows) || !Array.isArray(valueToRows)) {
      throw new Error(
        'DiffCollapser: valueFrom and valueTro must be arrays when isIterable is true',
      )
    }

    changeCount = countChangedFieldsInRows({
      config,
      field,
      locales,
      parentIsLocalized,
      valueFromRows,
      valueToRows,
    })
  } else {
    changeCount = countChangedFields({
      config,
      fields,
      locales,
      parentIsLocalized,
      valueFrom,
      valueTo,
    })
  }

  const contentClassNames = [
    `${baseClass}__content`,
    isCollapsed && `${baseClass}__content--is-collapsed`,
    hideGutter && `${baseClass}__content--hide-gutter`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={baseClass}>
      <FieldDiffLabel>
        <button
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          className={`${baseClass}__toggle-button`}
          onClick={() => setIsCollapsed(!isCollapsed)}
          type="button"
        >
          <div className={`${baseClass}__label`}>{Label}</div>

          <ChevronIcon direction={isCollapsed ? 'right' : 'down'} size={'small'} />
        </button>
        {changeCount > 0 && isCollapsed && (
          <span className={`${baseClass}__field-change-count`}>
            {t('version:changedFieldsCount', { count: changeCount })}
          </span>
        )}
      </FieldDiffLabel>
      <div className={contentClassNames}>{children}</div>
    </div>
  )
}
