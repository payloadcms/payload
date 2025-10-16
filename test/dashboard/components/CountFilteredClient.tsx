/* eslint-disable no-restricted-exports */

'use client'

// Client-side version that reactively updates when search params change
// Fetches count data from Payload's REST API

import type { WidgetServerProps } from 'payload'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type CountData = {
  count: number
  error: null | string
}

export default function CountFilteredClient({ widgetData }: WidgetServerProps) {
  const searchParams = useSearchParams()
  const [data, setData] = useState<CountData>({ count: 0, error: null })
  const [isLoading, setIsLoading] = useState(true)

  // Widget configuration
  const collection = (widgetData?.collection as string) || 'tickets'
  const title = (widgetData?.title as string) || 'Filtered Count (clientabc)'
  const color = (widgetData?.color as 'blue' | 'green' | 'orange' | 'purple' | 'red') || 'blue'
  const icon = (widgetData?.icon as string) || '📊'
  const filterFields = (widgetData?.filterFields as string[]) || ['status', 'priority']
  const changePercent = 10
  const changeText = '10% increase'

  // Memoize filterFields to prevent infinite loop (array reference changes every render)
  const filterFieldsKey = filterFields.join(',')

  useEffect(() => {
    const fetchCount = async () => {
      setIsLoading(true)
      try {
        // Build API URL with Payload's bracket notation for where clauses
        // Format: where[field][equals]=value
        const params = new URLSearchParams()
        params.set('limit', '0') // We only need the count

        for (const field of filterFields) {
          const value = searchParams?.get(field)
          if (value) {
            params.set(`where[${field}][equals]`, value)
          }
        }

        const response = await fetch(`/api/${collection}?${params.toString()}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }

        const result = await response.json()
        setData({ count: result.totalDocs, error: null })
      } catch (err) {
        setData({
          count: 0,
          error: err instanceof Error ? err.message : 'Failed to fetch count',
        })
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCount()
  }, [searchParams, collection, filterFieldsKey])

  const getColorStyles = (color: 'blue' | 'green' | 'orange' | 'purple' | 'red') => {
    const colors = {
      blue: { backgroundColor: '#eff6ff', color: '#2563eb' },
      green: { backgroundColor: '#ecfdf5', color: '#059669' },
      orange: { backgroundColor: '#fff7ed', color: '#ea580c' },
      purple: { backgroundColor: '#faf5ff', color: '#9333ea' },
      red: { backgroundColor: '#fef2f2', color: '#dc2626' },
    }
    return colors[color]
  }

  return (
    <div
      className="count-widget card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        opacity: isLoading ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {data.error ? (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            height: '100%',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '24px' }}>
            <span aria-label="Warning" role="img">
              ⚠️
            </span>
          </div>
          <h3 style={{ fontSize: '16px', margin: 0 }}>{title}</h3>
          <p style={{ color: '#ef4444', fontSize: '12px', margin: 0, textAlign: 'center' }}>
            {data.error}
          </p>
        </div>
      ) : (
        <>
          <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
            <div
              style={{
                alignItems: 'center',
                borderRadius: '8px',
                display: 'flex',
                fontSize: '18px',
                height: '40px',
                justifyContent: 'center',
                width: '40px',
                ...getColorStyles(color),
              }}
            >
              <span aria-label={`${title} icon`} role="img">
                {icon}
              </span>
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>{title}</h3>
          </div>

          <div>
            <span style={{ fontSize: '32px', fontWeight: 700 }}>{data.count.toLocaleString()}</span>
          </div>

          {changePercent && changeText && (
            <div style={{ alignItems: 'center', display: 'flex', gap: '6px', marginTop: 'auto' }}>
              <span
                style={{
                  color: changePercent > 0 ? '#059669' : changePercent < 0 ? '#dc2626' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {changePercent > 0 ? '+' : ''}
                {changePercent}%
              </span>
              <span style={{ fontSize: '14px', opacity: 0.7 }}>{changeText}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
