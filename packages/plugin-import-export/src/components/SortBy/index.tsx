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
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { applySortOrder, normalizeQueryParam, stripSortDash } from '../../utilities/sortHelpers.js'
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
  // Needed so we can initialize sortOrder when SortOrder component is hidden
  const { setValue: setSortOrder } = useField<'asc' | 'desc'>({ path: 'sortOrder' })

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
    () => reduceFields({ excludeUnsortable: true, fields: collectionConfig?.fields }),
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

  // One-time init guard so clearing `sort` doesn't rehydrate from query again
  const didInitRef = useRef(false)

  // Sync the visible select from list-view query sort (preferred) or groupBy (fallback)
  // and initialize both `sort` and `sortOrder` here as SortOrder may be hidden by admin.condition.
  useEffect(() => {
    if (didInitRef.current) {
      return
    }
    if (id) {
      didInitRef.current = true
      return
    }
    if (typeof sortRaw === 'string' && sortRaw.length > 0) {
      // Already initialized elsewhere
      didInitRef.current = true
      return
    }

    const qsSort = normalizeQueryParam(query?.sort)
    const qsGroupBy = normalizeQueryParam(query?.groupBy)

    const source = qsSort ?? qsGroupBy
    if (!source) {
      didInitRef.current = true
      return
    }

    const isDesc = !!qsSort && qsSort.startsWith('-')
    const base = stripSortDash(source)
    const order: 'asc' | 'desc' = isDesc ? 'desc' : 'asc'

    // Write BOTH fields so preview/export have the right values even if SortOrder is hidden
    setSort(applySortOrder(base, order))
    setSortOrder(order)

    const option = fieldOptions.find((f) => f.value === base)
    if (option) {
      setDisplayedValue(option)
    }

    didInitRef.current = true
  }, [id, query?.groupBy, query?.sort, sortRaw, fieldOptions, setSort, setSortOrder])

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
