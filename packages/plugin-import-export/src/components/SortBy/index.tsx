'use client'

import type { SelectFieldClientComponent } from 'payload'
import type { ReactNode } from 'react'

import {
  FieldLabel,
  ReactSelect,
  useConfig,
  useDocumentInfo,
  useField,
  useListQuery,
} from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { applySortOrder, stripSortDash } from '../../utilities/sortHelpers.js'
import { reduceFields } from '../FieldsToExport/reduceFields.js'
import { useImportExport } from '../ImportExportProvider/index.js'
import './index.scss'

const baseClass = 'sort-by-fields'

export const SortBy: SelectFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()

  // The "sort" text field that stores 'title' or '-title'
  const { setValue: setSort, value: sortRaw } = useField<string>()

  // Sibling order field ('asc' | 'desc') used when writing sort on change
  const { value: sortOrder = 'asc' } = useField<string>({ path: 'sortOrder' })

  const { value: collectionSlug } = useField<string>({ path: 'collectionSlug' })
  const { query } = useListQuery()
  const { getEntityConfig } = useConfig()
  const { collection } = useImportExport()

  // ReactSelect's displayed option
  const [displayedValue, setDisplayedValue] = useState<{
    id: string
    label: ReactNode
    value: string
  } | null>(null)

  const collectionConfig = getEntityConfig({ collectionSlug: collectionSlug ?? collection })
  const fieldOptions = useMemo(
    () => reduceFields({ fields: collectionConfig?.fields }),
    [collectionConfig?.fields],
  )

  // Normalize the stored value for display (strip the '-') and pick the option
  useEffect(() => {
    const clean = stripSortDash(sortRaw)
    if (!clean) {
      setDisplayedValue(null)
      return
    }

    const option = fieldOptions.find((f) => f.value === clean)
    if (option && (!displayedValue || displayedValue.value !== clean)) {
      setDisplayedValue(option)
    }
  }, [sortRaw, fieldOptions, displayedValue])

  // Sync the visible select from list-view query sort,
  // but no need to write to the "sort" field here — SortOrder owns initial combined value.
  useEffect(() => {
    if (id || !query?.sort || sortRaw) {
      return
    }

    if (!query.sort) {
      return
    }

    const clean = stripSortDash(query.sort as string)
    const option = fieldOptions.find((f) => f.value === clean)
    if (option) {
      setDisplayedValue(option)
    }
  }, [id, query?.sort, sortRaw, fieldOptions])

  // When user selects a different field, store it with the current order applied
  const onChange = (option: { id: string; label: ReactNode; value: string } | null) => {
    if (!option) {
      setSort('')
      setDisplayedValue(null)
    } else {
      setDisplayedValue(option)
      const next = applySortOrder(option.value, String(sortOrder) as 'asc' | 'desc')
      setSort(next)
    }
  }

  return (
    <div className={baseClass}>
      <FieldLabel label={props.field.label} path={props.path} />
      <ReactSelect
        className={baseClass}
        disabled={props.readOnly}
        getOptionValue={(option) => String(option.value)}
        inputId={`field-${props.path.replace(/\./g, '__')}`}
        isClearable={true}
        isSortable={true}
        // @ts-expect-error react select option
        onChange={onChange}
        options={fieldOptions}
        // @ts-expect-error react select
        value={displayedValue}
      />
    </div>
  )
}
