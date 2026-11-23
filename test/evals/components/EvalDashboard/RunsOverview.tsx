import React from 'react'

import type { RunGroup } from './configuration.js'

import { configStats, formatLocalTimestamp } from './configuration.js'

type Props = {
  onSelect: (runKey: string) => void
  runs: RunGroup[]
}

function ConfigBadges({
  model,
  runner,
  skillOn,
}: {
  model: string
  runner: string
  skillOn: boolean
}) {
  const pill = (bg: string, color: string, text: string, mono?: boolean) => (
    <span
      style={{
        background: bg,
        borderRadius: '4px',
        color,
        fontFamily: mono ? 'var(--font-mono, monospace)' : undefined,
        fontSize: '0.72rem',
        fontWeight: 600,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
  return (
    <span style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {pill('var(--theme-elevation-150)', 'var(--theme-elevation-700)', runner)}
      {pill('var(--theme-elevation-100)', 'var(--theme-elevation-800)', model, true)}
      {skillOn
        ? pill('var(--theme-success-100)', 'var(--theme-success-700)', 'skill')
        : pill('var(--theme-elevation-100)', 'var(--theme-elevation-600)', 'baseline')}
    </span>
  )
}

function PassRateCell({
  passed,
  passRate,
  total,
}: {
  passed: number
  passRate: number
  total: number
}) {
  const pct = Math.round(passRate * 100)
  const barColor =
    pct >= 80
      ? 'var(--theme-success-500)'
      : pct >= 50
        ? 'var(--color-warning-500, #e8a838)'
        : 'var(--theme-error-500)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
        {pct}%{' '}
        <span style={{ color: 'var(--theme-elevation-500)', fontWeight: 400 }}>
          ({passed}/{total})
        </span>
      </span>
      <div
        style={{
          background: 'var(--theme-elevation-150)',
          borderRadius: '3px',
          height: '5px',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div style={{ background: barColor, height: '100%', width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function RunsOverview({ onSelect, runs }: Props) {
  const cols = '160px 1fr 120px 80px 110px'
  const headerStyle: React.CSSProperties = {
    color: 'var(--theme-elevation-500)',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ color: 'var(--theme-elevation-500)', fontSize: '0.82rem', margin: 0 }}>
        Every <strong>run</strong> (one <code>pnpm test:eval</code> invocation), newest first. Click
        the top row to open your latest run. Pass rate and score are scoped to that single run.
      </p>
      <div
        style={{
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 'var(--style-radius-m)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'var(--theme-elevation-50)',
            borderBottom: '1px solid var(--theme-elevation-150)',
            display: 'grid',
            gap: '0 12px',
            gridTemplateColumns: cols,
            padding: '8px 12px',
          }}
        >
          <span style={headerStyle}>Run</span>
          <span style={headerStyle}>Configuration</span>
          <span style={headerStyle}>Pass Rate</span>
          <span style={headerStyle}>Avg Score</span>
          <span style={headerStyle}>Tokens</span>
        </div>
        {runs.map((run, i) => {
          const stats = configStats(run.entries)
          return (
            <div
              key={run.key}
              onClick={() => onSelect(run.key)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(run.key)}
              role="button"
              style={{
                alignItems: 'center',
                borderBottom:
                  i < runs.length - 1 ? '1px solid var(--theme-elevation-100)' : undefined,
                cursor: 'pointer',
                display: 'grid',
                gap: '0 12px',
                gridTemplateColumns: cols,
                padding: '12px',
              }}
              tabIndex={0}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--theme-elevation-800)', fontSize: '0.78rem' }}>
                  {formatLocalTimestamp(run.timestamp)}
                </span>
              </span>
              <ConfigBadges
                model={run.config.model}
                runner={run.config.runner}
                skillOn={run.config.skillOn}
              />
              <PassRateCell passed={stats.passed} passRate={stats.passRate} total={stats.total} />
              <span style={{ fontSize: '0.8rem' }}>
                {stats.avgScore !== null ? stats.avgScore.toFixed(2) : '—'}
              </span>
              <span style={{ color: 'var(--theme-elevation-600)', fontSize: '0.78rem' }}>
                {stats.totalTokens > 0 ? stats.totalTokens.toLocaleString() : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
