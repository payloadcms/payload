/* eslint-disable no-restricted-exports */
'use client'

import { type DashboardConfig, type Payload } from 'payload'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface RevenueProps {
  dashboardConfig: DashboardConfig
  payload: Payload
  timeframe?: 'daily' | 'monthly' | 'weekly'
  title?: string
  widgetSlug: string
}

interface RevenueData {
  amount: number
  date: string
  period: string
}

export default function Revenue({
  timeframe = 'monthly',
  title = 'Revenue Statistics',
}: RevenueProps) {
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

  // @ts-ignore - Recharts tooltip types
  const CustomTooltip = ({ active, label, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '8px 12px',
          }}
        >
          <p style={{ fontSize: '12px', margin: '0 0 4px 0', opacity: 0.7 }}>{label}</p>
          <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className="revenue-widget"
      style={{
        display: 'flex',
        flexDirection: 'column',
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
              background: '#f9fafb',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
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
          <AreaChart data={mockData} margin={{ bottom: 5, left: 20, right: 30, top: 20 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              axisLine={false}
              dataKey="period"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
              tickLine={false}
            />
            <Tooltip content={CustomTooltip} />
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
    </div>
  )
}
