/* eslint-disable no-restricted-exports */
'use client'

import { useSearchParams } from 'next/navigation'
import { type WidgetServerProps } from 'payload'
import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface RevenueData {
  amount: number
  date: string
  period: string
}

interface RevenueDoc {
  amount: number
  category?: string
  date: string
}

// Helper to calculate date range from filter
function getDateRange(dateRangeFilter: null | string): { endDate: Date; startDate: Date } {
  const endDate = new Date()
  const startDate = new Date()

  switch (dateRangeFilter) {
    case 'last-3-months':
      startDate.setMonth(endDate.getMonth() - 3)
      break
    case 'last-6-months':
      startDate.setMonth(endDate.getMonth() - 6)
      break
    case 'last-7-days':
      startDate.setDate(endDate.getDate() - 7)
      break
    case 'last-30-days':
      startDate.setDate(endDate.getDate() - 30)
      break
    case 'last-year':
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
    case 'ytd':
      startDate.setMonth(0, 1) // January 1st of current year
      break
    case 'all-time':
    default:
      startDate.setFullYear(2020, 0, 1) // Arbitrary start date
      break
  }

  return { endDate, startDate }
}

// Group revenue data by month for chart display
function groupByMonth(docs: RevenueDoc[]): RevenueData[] {
  const grouped = new Map<string, number>()

  docs.forEach((doc) => {
    const date = new Date(doc.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const existing = grouped.get(monthKey) || 0
    grouped.set(monthKey, existing + doc.amount)
  })

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => {
      const [year, month] = date.split('-')
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      return {
        amount,
        date,
        period: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
      }
    })
}

export default function RevenueFiltered(_props: WidgetServerProps) {
  const searchParams = useSearchParams()
  const [data, setData] = useState<RevenueData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<null | string>(null)

  const title = 'Revenue Statistics'
  const dateRangeFilter = searchParams?.get('dateRange')

  useEffect(() => {
    const fetchRevenue = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { endDate, startDate } = getDateRange(dateRangeFilter)

        // Build API query with date range filter
        const params = new URLSearchParams()
        params.set('limit', '1000')
        params.set('where[date][greater_than_equal]', startDate.toISOString().split('T')[0])
        params.set('where[date][less_than_equal]', endDate.toISOString().split('T')[0])

        const response = await fetch(`/api/revenue?${params.toString()}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }

        const result = await response.json()
        const groupedData = groupByMonth(result.docs)
        setData(groupedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch revenue data')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchRevenue()
  }, [dateRangeFilter])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      currency: 'USD',
      minimumFractionDigits: 0,
      style: 'currency',
    }).format(value)
  }

  function CustomTooltip(props: {
    active?: boolean
    label?: number | string
    payload?: { value: number }[]
  }) {
    const { active, label, payload } = props
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: 'var(--theme-elevation-0)',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            color: 'var(--theme-text)',
            padding: '8px 12px',
          }}
        >
          <p
            style={{
              color: 'var(--theme-text)',
              fontSize: '12px',
              margin: '0 0 4px 0',
              opacity: 0.7,
            }}
          >
            {label}
          </p>
          <p style={{ color: 'var(--theme-text)', fontSize: '14px', fontWeight: 600, margin: 0 }}>
            {formatCurrency(payload[0]?.value ?? 0)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className="revenue-widget card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        height: '100%',
        opacity: isLoading ? 0.6 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
          {title}
          {isLoading && (
            <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.5 }}>Loading...</span>
          )}
        </h3>
        {dateRangeFilter && (
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            {dateRangeFilter.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </div>
        )}
      </div>

      {error ? (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          <div style={{ fontSize: '24px' }}>
            <span aria-label="Warning" role="img">
              ⚠️
            </span>
          </div>
          <p style={{ color: '#ef4444', fontSize: '14px', margin: 0 }}>{error}</p>
        </div>
      ) : data.length === 0 && !isLoading ? (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          <div style={{ fontSize: '24px' }}>
            <span aria-label="No revenue data available" role="img">
              📊
            </span>
          </div>
          <p style={{ fontSize: '14px', margin: 0, opacity: 0.7 }}>No revenue data available</p>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer height={300} width="100%">
            <AreaChart
              data={data}
              margin={{ bottom: 35, left: 5, right: 5, top: 10 }}
              style={{ outline: 'none' }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                axisLine={false}
                dataKey="period"
                tick={{ fill: 'var(--theme-elevation-500)', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: 'var(--theme-elevation-500)', fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                dataKey="amount"
                fill="url(#revenueGradient)"
                stroke="#3B82F6"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
