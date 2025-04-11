'use client'
import type { ClientField } from 'payload'

import { ChevronIcon, FieldDiffLabel, Pill, useConfig, useTranslation } from '@payloadcms/ui'
import { fieldIsArrayType, fieldIsBlockType } from 'payload/shared'
import React, { useState } from 'react'

import './index.scss'
import { countChangedFields, countChangedFieldsInRows } from '../utilities/countChangedFields.js'

const baseClass = 'diff-collapser'

type Props =
  | {
      // fields collapser
      children: React.ReactNode
      field?: never
      fields: ClientField[]
      initCollapsed?: boolean
      isIterable?: false
      label: React.ReactNode
      locales: string[] | undefined
      parentIsLocalized: boolean
      valueFrom: unknown
      valueTo: unknown
    }
  | {
      // iterable collapser
      children: React.ReactNode
      field: ClientField
      fields?: never
      initCollapsed?: boolean
      isIterable: true
      label: React.ReactNode
      locales: string[] | undefined
      parentIsLocalized: boolean
      valueFrom?: unknown
      valueTo: unknown
    }

export const DiffCollapser: React.FC<Props> = ({
  children,
  field,
  fields,
  initCollapsed = false,
  isIterable = false,
  label,
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
    const comparisonRows = valueFrom ?? []
    const versionRows = valueTo ?? []

    if (!Array.isArray(comparisonRows) || !Array.isArray(versionRows)) {
      throw new Error(
        'DiffCollapser: comparison and version must be arrays when isIterable is true',
      )
    }

    changeCount = countChangedFieldsInRows({
      comparisonRows,
      config,
      field,
      locales,
      parentIsLocalized,
      versionRows,
    })
  } else {
    changeCount = countChangedFields({
      comparison: valueFrom,
      config,
      fields,
      locales,
      parentIsLocalized,
      version: valueTo,
    })
  }

  const contentClassNames = [
    `${baseClass}__content`,
    isCollapsed && `${baseClass}__content--is-collapsed`,
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
          <span className={`${baseClass}__label`}>{label}</span>

          <ChevronIcon direction={isCollapsed ? 'right' : 'down'} size={'small'} />
        </button>
        {changeCount > 0 && isCollapsed && (
          <Pill className={`${baseClass}__field-change-count`} pillStyle="light-gray" size="small">
            {t('version:changedFieldsCount', { count: changeCount })}
          </Pill>
        )}
      </FieldDiffLabel>
      <div className={contentClassNames}>{children}</div>
    </div>
  )
}
