'use client'
import type { ClientField } from 'payload'

import { fieldIsArrayType, fieldIsBlockType } from 'payload/shared'
import React, { useState } from 'react'

import { FieldDiffLabel } from '../../../../elements/FieldDiffLabel/index.js'
import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.css'
import { countChangedFields, countChangedFieldsInRows } from '../utilities/countChangedFields.js'

const baseClass = 'diff-collapser'

type Props = {
  changeCountOverride?: number
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
  changeCountOverride,
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

  let changeCount = changeCountOverride ?? 0

  if (changeCountOverride === undefined && isIterable) {
    if (!fieldIsArrayType(field) && !fieldIsBlockType(field)) {
      throw new Error(
        'DiffCollapser: field must be an array or blocks field when isIterable is true',
      )
    }
    const valueFromRows = valueFrom ?? []
    const valueToRows = valueTo ?? []

    if (!Array.isArray(valueFromRows) || !Array.isArray(valueToRows)) {
      throw new Error('DiffCollapser: valueFrom and valueTo must be arrays when isIterable is true')
    }

    changeCount = countChangedFieldsInRows({
      config,
      field,
      locales,
      parentIsLocalized,
      valueFromRows,
      valueToRows,
    })
  } else if (changeCountOverride === undefined) {
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
          aria-label={isCollapsed ? t('general:expand') : t('general:collapse')}
          className={`${baseClass}__toggle-button`}
          onClick={() => setIsCollapsed(!isCollapsed)}
          type="button"
        >
          <div className={`${baseClass}__label`}>{Label}</div>

          <ChevronIcon direction={isCollapsed ? 'right' : 'down'} size={16} />
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
