/* eslint-disable no-restricted-exports */
'use client'

import { type WidgetServerProps } from 'payload'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface RevenueData {
  amount: number
  date: string
  period: string
}

export default function Revenue({ widgetData }: WidgetServerProps) {
  const typedWidgetData = widgetData as { timeframe?: string; title?: string } | undefined
  const timeframe =
    typeof typedWidgetData?.timeframe === 'string' && typedWidgetData.timeframe
      ? typedWidgetData.timeframe
      : 'monthly'
  const title =
    typeof typedWidgetData?.title === 'string' && typedWidgetData.title
      ? typedWidgetData.title
      : 'Revenue Statistics'
  // Mock data for now - in real implementation, this would come from props or server-side fetch
  const mockData: RevenueData[] = [
    { amount: 20000, date: '2024-01', period: 'Jan' },
    { amount: 25000, date: '2024-02', period: 'Feb' },
    { amount: 18000, date: '2024-03', period: 'Mar' },
    { amount: 30000, date: '2024-04', period: 'Apr' },
    { amount: 35000, date: '2024-05', period: 'May' },
    { amount: 28000, date: '2024-06', period: 'Jun' },
    { amount: 40000, date: '2024-07', period: 'Jul' },
    { amount: 38000, date: '2024-08', period: 'Aug' },
    { amount: 45000, date: '2024-09', period: 'Sep' },
    { amount: 42000, date: '2024-10', period: 'Oct' },
    { amount: 48000, date: '2024-11', period: 'Nov' },
    { amount: 52000, date: '2024-12', period: 'Dec' },
  ]

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
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{title}</h3>
        <div>
          <select
            defaultValue={timeframe}
            style={{
              background: 'var(--theme-elevation-50)',
              border: '1px solid var(--theme-elevation-200)',
              borderRadius: '4px',
              color: 'var(--theme-text)',
              fontSize: '12px',
              outline: 'none',
              padding: '4px 8px',
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer height={300} width="100%">
          <AreaChart
            data={mockData}
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
              isAnimationActive={false}
              stroke="#3B82F6"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
