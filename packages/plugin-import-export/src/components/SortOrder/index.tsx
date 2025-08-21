'use client'

import type { SelectFieldClientComponent } from 'payload'

import { FieldLabel, ReactSelect, useDocumentInfo, useField, useListQuery } from '@payloadcms/ui'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { applySortOrder, normalizeQueryParam, stripSortDash } from '../../utilities/sortHelpers.js'
import './index.scss'

const baseClass = 'sort-order-field'

type Order = 'asc' | 'desc'
type OrderOption = { label: string; value: Order }

const options = [
  { label: 'Ascending', value: 'asc' as const },
  { label: 'Descending', value: 'desc' as const },
] as const

const defaultOption: OrderOption = options[0]

export const SortOrder: SelectFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()
  const { query } = useListQuery()

  // 'sortOrder' select field: 'asc' | 'desc'
  const { setValue: setOrder, value: orderValueRaw } = useField<Order>()

  // 'sort' text field: 'title' | '-title'
  const { setValue: setSort, value: sortRaw } = useField<string>({ path: 'sort' })

  // The current order value, defaulting to 'asc' for UI
  const orderValue: Order = orderValueRaw || 'asc'

  // Map 'asc' | 'desc' to the option object for ReactSelect
  const currentOption = useMemo<OrderOption>(
    () => options.find((o) => o.value === orderValue) ?? defaultOption,
    [orderValue],
  )
  const [displayed, setDisplayed] = useState<null | OrderOption>(currentOption)

  // One-time init guard so clearing `sort` doesn't rehydrate from query again
  const didInitRef = useRef(false)

  // Derive from list-view query.sort if present; otherwise fall back to groupBy
  useEffect(() => {
    if (didInitRef.current) {
      return
    }

    // Existing export -> don't initialize here
    if (id) {
      didInitRef.current = true
      return
    }

    // If sort already has a value, treat as initialized
    if (typeof sortRaw === 'string' && sortRaw.length > 0) {
      didInitRef.current = true
      return
    }

    const qsSort = normalizeQueryParam(query?.sort)
    const qsGroupBy = normalizeQueryParam(query?.groupBy)

    if (qsSort) {
      const isDesc = qsSort.startsWith('-')
      const base = stripSortDash(qsSort)
      const order: Order = isDesc ? 'desc' : 'asc'
      setOrder(order)
      setSort(applySortOrder(base, order)) // combined: 'title' or '-title'
      didInitRef.current = true
      return
    }

    // Fallback: groupBy (always ascending)
    if (qsGroupBy) {
      setOrder('asc')
      setSort(applySortOrder(qsGroupBy, 'asc')) // write 'groupByField' (no dash)
      didInitRef.current = true
      return
    }

    // Nothing to initialize
    didInitRef.current = true
  }, [id, query?.sort, query?.groupBy, sortRaw, setOrder, setSort])

  // Keep the select's displayed option in sync with the stored order
  useEffect(() => {
    setDisplayed(currentOption ?? defaultOption)
  }, [currentOption])

  // Handle manual order changes via ReactSelect:
  //  - update the order field
  //  - rewrite the combined "sort" string to add/remove the leading '-'
  const onChange = (option: null | OrderOption) => {
    const next = option?.value ?? 'asc'
    setOrder(next)

    const base = stripSortDash(sortRaw)
    if (base) {
      setSort(applySortOrder(base, next))
    }

    setDisplayed(option ?? defaultOption)
  }

  return (
    <div className={baseClass}>
      <FieldLabel label={props.field.label} path={props.path} />
      <ReactSelect
        className={baseClass}
        disabled={props.readOnly}
        inputId={`field-${props.path.replace(/\./g, '__')}`}
        isClearable={false}
        isSearchable={false}
        // @ts-expect-error react-select option typing differs from our local type
        onChange={onChange}
        options={options as unknown as OrderOption[]}
        // @ts-expect-error react-select option typing differs from our local type
        value={displayed}
      />
    </div>
  )
}
