'use client'

import type { SelectFieldClientComponent } from 'payload'

import { FieldLabel, ReactSelect, useDocumentInfo, useField, useListQuery } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { applySortOrder, stripSortDash } from '../../utilities/sortHelpers.js'
import './index.scss'

const baseClass = 'sort-order-field'

type Order = 'asc' | 'desc'
type OrderOption = { label: string; value: Order }

const options = [
  { label: 'Ascending', value: 'asc' as const },
  { label: 'Descending', value: 'desc' as const },
] as const

const defaultOption: OrderOption = options[0]

// Safely coerce query.sort to a string (ignore arrays)
const normalizeSortParam = (v: unknown): string | undefined => {
  if (typeof v === 'string') {
    return v
  }
  if (Array.isArray(v) && typeof v[0] === 'string') {
    return v[0]
  }
  return undefined
}

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

  // Derive from list-view query.sort if present
  useEffect(() => {
    if (id) {
      return
    }
    const qs = normalizeSortParam(query?.sort)
    if (!qs) {
      return
    }

    const isDesc = qs.startsWith('-')
    const base = stripSortDash(qs)
    const order: Order = isDesc ? 'desc' : 'asc'

    setOrder(order)
    setSort(applySortOrder(base, order))
  }, [id, query?.sort, setOrder, setSort])

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
