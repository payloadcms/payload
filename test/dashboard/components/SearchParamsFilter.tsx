/* eslint-disable no-restricted-exports */
'use client'

// Global dashboard filters panel
// Sets URL params that widgets can interpret based on their needs
// e.g. dateRange=last-month, status=open, etc.

import type { WidgetServerProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

type FilterOption = {
  label: string
  value: string
}

type FilterConfig = {
  field: string
  label: string
  options: FilterOption[]
  type?: 'date-range' | 'select'
}

// Predefined date range options
const DATE_RANGE_OPTIONS: FilterOption[] = [
  { label: 'Last 7 days', value: 'last-7-days' },
  { label: 'Last 30 days', value: 'last-30-days' },
  { label: 'Last 3 months', value: 'last-3-months' },
  { label: 'Last 6 months', value: 'last-6-months' },
  { label: 'Last year', value: 'last-year' },
  { label: 'Year to date', value: 'ytd' },
  { label: 'All time', value: 'all-time' },
]

export default function SearchParamsFilter({ widgetData }: WidgetServerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Widget configuration - global filters that apply across widgets
  const title = (widgetData?.title as string) || 'Dashboard Filters'
  const filters = (widgetData?.filters as FilterConfig[]) || [
    {
      type: 'date-range',
      field: 'dateRange',
      label: 'Date Range (revenue)',
      options: DATE_RANGE_OPTIONS,
    },
    {
      field: 'status',
      label: 'Status',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    {
      field: 'priority',
      label: 'Priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
    },
  ]
  const showClearAll = (widgetData?.showClearAll as boolean) ?? true

  const updateSearchParam = useCallback(
    (field: string, value: null | string) => {
      const params = new URLSearchParams(searchParams?.toString() || '')

      if (value === null || value === '') {
        params.delete(field)
      } else {
        params.set(field, value)
      }

      const queryString = params.toString()
      const newUrl = queryString ? `/admin?${queryString}` : '/admin'

      // Use replace to update URL without adding to history
      router.replace(newUrl)
      router.refresh()

      //   // Use startTransition to ensure refresh happens after URL update
      //   setTimeout(() => {
      //     router.refresh()
      //   }, 0)
    },
    [router, searchParams],
  )

  const clearAllFilters = useCallback(() => {
    router.replace('/admin')
    setTimeout(() => {
      router.refresh()
    }, 0)
  }, [router])

  const hasActiveFilters = filters.some((filter) => searchParams?.get(filter.field))

  return (
    <div
      className="filter-widget card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{title}</h3>
        {showClearAll && hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--theme-error-500)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 8px',
            }}
            type="button"
          >
            Clear All
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filters.map((filter) => {
          const currentValue = searchParams?.get(filter.field) || ''

          return (
            <div
              key={filter.field}
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <label
                htmlFor={`filter-${filter.field}`}
                style={{ fontSize: '13px', fontWeight: 500, opacity: 0.8 }}
              >
                {filter.label}
              </label>
              <select
                id={`filter-${filter.field}`}
                onChange={(e) => updateSearchParam(filter.field, e.target.value)}
                style={{
                  background: 'var(--theme-elevation-0)',
                  border: '1px solid var(--theme-elevation-300)',
                  borderRadius: '4px',
                  color: 'var(--theme-text)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '8px 12px',
                }}
                value={currentValue}
              >
                <option value="">All {filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {filters.length === 0 && (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px' }}>
            <span aria-label="No filters" role="img">
              🔍
            </span>
          </div>
          <p style={{ fontSize: '14px', margin: 0, opacity: 0.7 }}>
            No filters configured. Add filters via widgetData.
          </p>
        </div>
      )}
    </div>
  )
}
