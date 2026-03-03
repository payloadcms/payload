'use client'

import React, { useMemo, useState } from 'react'

import type { Audience } from './audience.js'
import type { EvalEntry, RunSnapshot } from './index.js'

import { AUDIENCE_CONFIG, getAudience } from './audience.js'

type Props = {
  compareMode: 'run' | 'variant'
  entries: EvalEntry[]
  onCompareModeChange: (mode: 'run' | 'variant') => void
  runs?: RunSnapshot[]
}

type ComparePair = {
  audience: Audience[]
  baseline?: EvalEntry
  category: string
  lowPower?: EvalEntry
  question: string
  skill?: EvalEntry
  type: 'codegen' | 'qa'
}

function AudienceBadges({ audiences }: { audiences: Audience[] }) {
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
      {audiences.map((a) => {
        const { bg, color, label } = AUDIENCE_CONFIG[a]
        return (
          <span
            key={a}
            style={{
              background: bg,
              borderRadius: '4px',
              color,
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 5px',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        )
      })}
    </span>
  )
}

function TypeBadge({ type }: { type: 'codegen' | 'qa' }) {
  return (
    <span
      style={{
        background: type === 'codegen' ? 'var(--theme-elevation-150)' : 'transparent',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '4px',
        color: 'var(--theme-elevation-700)',
        fontSize: '0.7rem',
        padding: '2px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {type === 'codegen' ? 'Codegen' : 'QA'}
    </span>
  )
}

/** Returns true if the model ID looks like a high-power / flagship model. */
function isHighPower(modelId: string | undefined): boolean {
  if (!modelId) {
    return true // untagged entries predate low-power tracking — treat as high-power
  }
  return modelId.includes('gpt-5') || modelId.includes('o3') || modelId.includes('claude-3-5')
}

type SortKey = 'audience' | 'category' | 'delta' | 'question' | 'type'
type SortDir = 'asc' | 'desc'

function cycleSort(current: null | SortDir): null | SortDir {
  if (current === null) {
    return 'asc'
  }
  if (current === 'asc') {
    return 'desc'
  }
  return null
}

function scoreDelta(pair: ComparePair): null | number {
  if (pair.skill?.result.score == null || pair.baseline?.result.score == null) {
    return null
  }
  return pair.skill.result.score - pair.baseline.result.score
}

function DeltaBadge({ delta, glow }: { delta: null | number; glow?: boolean }) {
  if (delta === null) {
    return <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.75rem' }}>—</span>
  }
  const isPositive = delta > 0.005
  const isNegative = delta < -0.005
  const color = isPositive
    ? 'var(--theme-success-600)'
    : isNegative
      ? 'var(--theme-error-600)'
      : 'var(--theme-elevation-500)'
  const bg = isPositive
    ? 'var(--theme-success-100)'
    : isNegative
      ? 'var(--theme-error-100)'
      : 'var(--theme-elevation-100)'
  const arrow = isPositive ? '↑' : isNegative ? '↓' : '='
  return (
    <span
      className={glow ? 'eval-improved-badge' : undefined}
      style={{
        background: bg,
        borderRadius: '4px',
        color,
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        fontWeight: 700,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {arrow} {delta > 0 ? '+' : ''}
      {delta.toFixed(2)}
    </span>
  )
}

function ResultCell({ borderLeft, entry }: { borderLeft?: boolean; entry?: EvalEntry }) {
  const dividerStyle: React.CSSProperties = borderLeft
    ? { borderLeft: '2px solid var(--theme-elevation-200)', paddingLeft: '12px' }
    : {}

  if (!entry) {
    return (
      <div
        style={{
          color: 'var(--theme-elevation-400)',
          fontSize: '0.75rem',
          fontStyle: 'italic',
          ...dividerStyle,
        }}
      >
        not run
      </div>
    )
  }
  const { pass, score, tscErrors, usage } = entry.result
  const isTsError = !pass && tscErrors && tscErrors.length > 0
  const color = pass
    ? 'var(--theme-success-600)'
    : isTsError
      ? 'var(--color-warning-600, #b97d10)'
      : 'var(--theme-error-600)'
  const bg = pass
    ? 'var(--theme-success-100)'
    : isTsError
      ? 'rgba(232,168,56,0.15)'
      : 'var(--theme-error-100)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...dividerStyle }}>
      <span
        style={{
          background: bg,
          borderRadius: '4px',
          color,
          display: 'inline-block',
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          fontWeight: 600,
          padding: '2px 7px',
          whiteSpace: 'nowrap',
        }}
      >
        {pass ? '✓ PASS' : isTsError ? '✗ TS Error' : '✗ FAIL'}
        {score !== undefined ? ` · ${score.toFixed(2)}` : ''}
      </span>
      {usage && (
        <span style={{ color: 'var(--theme-elevation-500)', fontSize: '0.7rem' }}>
          {usage.total.totalTokens.toLocaleString()} tokens
          {usage.total.cachedInputTokens > 0 && (
            <span>
              {' '}
              · {Math.round((usage.total.cachedInputTokens / usage.total.inputTokens) * 100)}%
              cached
            </span>
          )}
        </span>
      )}
    </div>
  )
}

function ExpandedCompareRow({ pair }: { pair: ComparePair }) {
  return (
    <div
      style={{
        borderTop: '1px solid var(--theme-elevation-100)',
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: '1fr 1fr 1fr',
        padding: '14px 12px',
      }}
    >
      <AnswerColumn
        color="var(--color-warning-500, #e8a838)"
        entry={pair.lowPower}
        label="Low Power (gpt-4o)"
        missingHint="pnpm run test:eval:low-power"
      />
      <AnswerColumn
        borderLeft
        color="var(--theme-elevation-600)"
        entry={pair.baseline}
        label="Baseline — no skill"
        missingHint="pnpm run test:eval:baseline"
      />
      <AnswerColumn
        color="var(--theme-success-700)"
        entry={pair.skill}
        label="With Skill — SKILL.md injected"
        missingHint="pnpm run test:eval"
      />
    </div>
  )
}

function AnswerColumn({
  borderLeft,
  color,
  entry,
  label,
  missingHint,
}: {
  borderLeft?: boolean
  color: string
  entry?: EvalEntry
  label: string
  missingHint: string
}) {
  const sectionStyle: React.CSSProperties = {
    borderLeft: borderLeft ? '2px solid var(--theme-elevation-200)' : undefined,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingLeft: borderLeft ? '16px' : undefined,
  }
  const labelStyle: React.CSSProperties = {
    color: 'var(--theme-elevation-500)',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  }
  const answerStyle: React.CSSProperties = {
    background: 'var(--theme-elevation-50)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: '4px',
    fontSize: '0.78rem',
    lineHeight: 1.6,
    maxHeight: '240px',
    overflow: 'auto',
    padding: '8px 10px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }
  return (
    <div style={sectionStyle}>
      <span style={{ ...labelStyle, color }}>{label}</span>
      {entry ? (
        <>
          <div style={answerStyle}>{entry.result.answer}</div>
          {entry.result.reasoning && (
            <div
              style={{
                ...answerStyle,
                background: 'transparent',
                border: 'none',
                paddingLeft: 0,
                paddingRight: 0,
              }}
            >
              <span style={labelStyle}>Reasoning: </span>
              {entry.result.reasoning}
            </div>
          )}
        </>
      ) : (
        <span
          style={{ color: 'var(--theme-elevation-400)', fontSize: '0.78rem', fontStyle: 'italic' }}
        >
          Not run yet — use <code>{missingHint}</code>
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mode Toggle — switches between variant comparison and run comparison
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Run Comparison View — compares two versioned run snapshots
// ---------------------------------------------------------------------------

type RunCategoryRow = {
  avgScoreBase: null | number
  avgScoreCompare: null | number
  category: string
  deltaPassRate: null | number
  deltaScore: null | number
  itemsBase: Array<{ pass: boolean; question: string; score?: number }>
  itemsCompare: Array<{ pass: boolean; question: string; score?: number }>
  passRateBase: null | number
  passRateCompare: null | number
  totalBase: number
  totalCompare: number
  type: 'codegen' | 'qa' | 'total'
}

function aggregateByCategory(results: RunSnapshot['results']): Map<
  string,
  {
    items: Array<{ pass: boolean; question: string; score?: number }>
    passed: number
    scored: number
    scoreSum: number
    total: number
  }
> {
  const map = new Map<
    string,
    {
      items: Array<{ pass: boolean; question: string; score?: number }>
      passed: number
      scored: number
      scoreSum: number
      total: number
    }
  >()
  for (const r of results) {
    const key = `${r.category}:::${r.type}`
    if (!map.has(key)) {
      map.set(key, { items: [], passed: 0, scored: 0, scoreSum: 0, total: 0 })
    }
    const entry = map.get(key)!
    entry.total++
    entry.items.push({ pass: r.pass, question: r.question, score: r.score })
    if (r.pass) {
      entry.passed++
    }
    if (r.score !== undefined) {
      entry.scored++
      entry.scoreSum += r.score
    }
  }
  return map
}

function RunStatCell({
  avgScore,
  items,
  passRate,
  total,
}: {
  avgScore: null | number
  items: Array<{ pass: boolean; question: string; score?: number }>
  passRate: null | number
  total: number
}) {
  if (total === 0) {
    return <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.75rem' }}>—</span>
  }
  const passed = Math.round((passRate ?? 0) * total)
  const pct = Math.round((passRate ?? 0) * 100)
  const barColor =
    pct >= 80
      ? 'var(--theme-success-500)'
      : pct >= 50
        ? 'var(--color-warning-500, #e8a838)'
        : 'var(--theme-error-500)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
        <span
          style={{
            color: 'var(--theme-elevation-800)',
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}
        >
          {passed}/{total}
        </span>
        <span style={{ color: 'var(--theme-elevation-500)', fontSize: '0.72rem' }}>{pct}%</span>
        {avgScore !== null && (
          <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.7rem' }}>
            · {avgScore.toFixed(2)}
          </span>
        )}
      </div>
      <div
        style={{
          background: 'var(--theme-elevation-150)',
          borderRadius: '3px',
          height: '5px',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          style={{
            background: barColor,
            borderRadius: '3px',
            height: '100%',
            width: `${pct}%`,
          }}
        />
      </div>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '1px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ alignItems: 'flex-start', display: 'flex', gap: '4px' }}>
              <span
                style={{
                  color: item.pass ? 'var(--theme-success-500)' : 'var(--theme-error-500)',
                  flexShrink: 0,
                  fontSize: '0.68rem',
                  lineHeight: '1.5',
                }}
              >
                {item.pass ? '✓' : '✗'}
              </span>
              <span
                style={{
                  color: item.pass ? 'var(--theme-elevation-600)' : 'var(--theme-elevation-800)',
                  fontSize: '0.68rem',
                  fontWeight: item.pass ? 400 : 500,
                  lineHeight: '1.5',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={item.question}
              >
                {item.question.length > 60 ? item.question.slice(0, 60) + '…' : item.question}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function variantPillStyle(variant: string): { bg: string; color: string } {
  if (variant === 'baseline') {
    return { bg: 'var(--theme-elevation-200)', color: 'var(--theme-elevation-700)' }
  }
  if (variant === 'low-power') {
    return { bg: 'rgba(232,168,56,0.2)', color: 'var(--color-warning-600, #b97d10)' }
  }
  // skill (default)
  return { bg: 'var(--theme-success-100)', color: 'var(--theme-success-700)' }
}

function RunDiffView({ runs }: { runs: RunSnapshot[] }) {
  const options = runs.map((r) => ({
    label: `${r.variant} / run ${String(r.run).padStart(3, '0')} — ${r.generatedAt.slice(0, 10)}`,
    value: r.filename,
  }))

  const [baseFilename, setBaseFilename] = useState<string>(() =>
    runs.length >= 2 ? (runs[runs.length - 2]?.filename ?? '') : (runs[0]?.filename ?? ''),
  )
  const [compareFilename, setCompareFilename] = useState<string>(() =>
    runs.length >= 1 ? (runs[runs.length - 1]?.filename ?? '') : '',
  )

  const baseSnap = runs.find((r) => r.filename === baseFilename)
  const compareSnap = runs.find((r) => r.filename === compareFilename)

  const rows = useMemo<RunCategoryRow[]>(() => {
    if (!baseSnap || !compareSnap) {
      return []
    }
    const baseMap = aggregateByCategory(baseSnap.results)
    const compareMap = aggregateByCategory(compareSnap.results)
    const keys = new Set([...baseMap.keys(), ...compareMap.keys()])
    return Array.from(keys)
      .map((key) => {
        const [category, type] = key.split(':::') as [string, 'codegen' | 'qa']
        const b = baseMap.get(key)
        const c = compareMap.get(key)
        const passRateBase = b ? b.passed / b.total : null
        const passRateCompare = c ? c.passed / c.total : null
        const avgScoreBase = b && b.scored > 0 ? b.scoreSum / b.scored : null
        const avgScoreCompare = c && c.scored > 0 ? c.scoreSum / c.scored : null
        return {
          type,
          avgScoreBase,
          avgScoreCompare,
          category,
          deltaPassRate:
            passRateBase !== null && passRateCompare !== null
              ? passRateCompare - passRateBase
              : null,
          deltaScore:
            avgScoreBase !== null && avgScoreCompare !== null
              ? avgScoreCompare - avgScoreBase
              : null,
          itemsBase: b?.items ?? [],
          itemsCompare: c?.items ?? [],
          passRateBase,
          passRateCompare,
          totalBase: b?.total ?? 0,
          totalCompare: c?.total ?? 0,
        }
      })
      .sort((a, b) => {
        const da = a.deltaPassRate ?? 0
        const db = b.deltaPassRate ?? 0
        return Math.abs(db) - Math.abs(da) || a.category.localeCompare(b.category)
      })
  }, [baseSnap, compareSnap])

  const selectStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid var(--theme-elevation-300)',
    borderRadius: '0',
    color: 'var(--theme-elevation-900)',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 700,
    outline: 'none',
    padding: '2px 4px',
  }

  const pctFmt = (v: null | number) => (v === null ? '—' : `${Math.round(v * 100)}%`)
  const deltaColor = (d: null | number) =>
    d === null
      ? 'var(--theme-elevation-400)'
      : d > 0.005
        ? 'var(--theme-success-600)'
        : d < -0.005
          ? 'var(--theme-error-600)'
          : 'var(--theme-elevation-500)'

  if (runs.length === 0) {
    return (
      <div
        style={{
          background: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 'var(--style-radius-m)',
          color: 'var(--theme-elevation-500)',
          fontSize: '0.875rem',
          padding: 'calc(var(--base) * 3)',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: '0 0 8px' }}>No run snapshots found yet.</p>
        <p style={{ color: 'var(--theme-elevation-400)', fontSize: '0.8rem', margin: 0 }}>
          Run the eval suite to generate snapshots: <code>pnpm run test:eval</code>
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--base)' }}>
      {/* Title row — selectors styled as heading */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '4px',
        }}
      >
        <span
          style={{
            color: 'var(--theme-elevation-500)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Comparing
        </span>
        <select
          onChange={(e) => setBaseFilename(e.target.value)}
          style={selectStyle}
          value={baseFilename}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          style={{
            color: 'var(--theme-elevation-400)',
            fontSize: '1.1rem',
            fontWeight: 300,
            padding: '0 2px',
          }}
        >
          →
        </span>
        <select
          onChange={(e) => setCompareFilename(e.target.value)}
          style={selectStyle}
          value={compareFilename}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {baseSnap && compareSnap && (
          <span
            style={{ color: 'var(--theme-elevation-400)', fontSize: '0.75rem', marginLeft: '4px' }}
          >
            · {rows.length} categor{rows.length !== 1 ? 'ies' : 'y'}
          </span>
        )}
      </div>

      {/* Summary strip */}
      {baseSnap && compareSnap && (
        <div
          style={{
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-m)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0,
          }}
        >
          {[
            { label: 'Base Pass Rate', value: pctFmt(baseSnap.summary.passRate) },
            {
              color: deltaColor(compareSnap.summary.passRate - baseSnap.summary.passRate),
              label: 'Compare Pass Rate',
              value: pctFmt(compareSnap.summary.passRate),
            },
            {
              color: deltaColor(compareSnap.summary.passRate - baseSnap.summary.passRate),
              label: 'Δ Pass Rate',
              value: `${compareSnap.summary.passRate - baseSnap.summary.passRate >= 0 ? '+' : ''}${Math.round((compareSnap.summary.passRate - baseSnap.summary.passRate) * 100)}%`,
            },
            {
              color: deltaColor(compareSnap.summary.avgScore - baseSnap.summary.avgScore),
              label: 'Δ Avg Score',
              value: `${compareSnap.summary.avgScore - baseSnap.summary.avgScore >= 0 ? '+' : ''}${(compareSnap.summary.avgScore - baseSnap.summary.avgScore).toFixed(3)}`,
            },
          ].map(({ color, label, value }, i, arr) => (
            <div
              key={label}
              style={{
                borderRight:
                  i < arr.length - 1 ? '1px solid var(--theme-elevation-150)' : undefined,
                flex: '1 1 auto',
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  color: 'var(--theme-elevation-500)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  color: color ?? 'var(--theme-elevation-900)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category diff table */}
      {rows.length > 0 && (
        <div
          style={{
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-m)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'var(--theme-elevation-50)',
              borderBottom: '1px solid var(--theme-elevation-150)',
              display: 'grid',
              gap: '0 12px',
              gridTemplateColumns: '120px 60px 1fr 1fr 90px 90px',
              padding: '8px 12px',
            }}
          >
            {['Category', 'Type', 'Base', 'Compare', 'Δ Pass Rate', 'Δ Avg Score'].map((h) => (
              <span
                key={h}
                style={{
                  color: 'var(--theme-elevation-500)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {h === 'Base' && baseSnap ? (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>Base</span>
                    <span
                      style={{
                        background: variantPillStyle(baseSnap.variant).bg,
                        borderRadius: '3px',
                        color: variantPillStyle(baseSnap.variant).color,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        padding: '1px 5px',
                        textTransform: 'uppercase',
                        width: 'fit-content',
                      }}
                    >
                      {baseSnap.variant}
                    </span>
                  </span>
                ) : h === 'Compare' && compareSnap ? (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>Compare</span>
                    <span
                      style={{
                        background: variantPillStyle(compareSnap.variant).bg,
                        borderRadius: '3px',
                        color: variantPillStyle(compareSnap.variant).color,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        padding: '1px 5px',
                        textTransform: 'uppercase',
                        width: 'fit-content',
                      }}
                    >
                      {compareSnap.variant}
                    </span>
                  </span>
                ) : (
                  h
                )}
              </span>
            ))}
          </div>
          {rows.map((row, i) => (
            <div
              key={`${row.category}-${row.type}`}
              style={{
                borderBottom:
                  i < rows.length - 1 ? '1px solid var(--theme-elevation-100)' : undefined,
                display: 'grid',
                gap: '0 12px',
                gridTemplateColumns: '120px 60px 1fr 1fr 90px 90px',
                padding: '9px 12px',
              }}
            >
              <div style={{ alignSelf: 'start', paddingTop: '1px' }}>
                <span
                  style={{
                    background: 'var(--theme-elevation-100)',
                    borderRadius: '4px',
                    color: 'var(--theme-elevation-800)',
                    display: 'inline-block',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    padding: '2px 6px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.category}
                </span>
              </div>
              <div style={{ alignSelf: 'start', paddingTop: '1px' }}>
                <span
                  style={{
                    background:
                      row.type === 'codegen' ? 'var(--theme-elevation-150)' : 'transparent',
                    border: '1px solid var(--theme-elevation-200)',
                    borderRadius: '4px',
                    color: 'var(--theme-elevation-700)',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.type === 'codegen' ? 'Codegen' : 'QA'}
                </span>
              </div>
              <RunStatCell
                avgScore={row.avgScoreBase}
                items={row.itemsBase}
                passRate={row.passRateBase}
                total={row.totalBase}
              />
              <RunStatCell
                avgScore={row.avgScoreCompare}
                items={row.itemsCompare}
                passRate={row.passRateCompare}
                total={row.totalCompare}
              />
              <div style={{ alignSelf: 'start', paddingTop: '1px' }}>
                <span
                  style={{
                    color: deltaColor(row.deltaPassRate),
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {row.deltaPassRate === null
                    ? '—'
                    : `${row.deltaPassRate >= 0 ? '+' : ''}${Math.round(row.deltaPassRate * 100)}%`}
                </span>
              </div>
              <div style={{ alignSelf: 'start', paddingTop: '1px' }}>
                <span
                  style={{
                    color: deltaColor(row.deltaScore),
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {row.deltaScore === null
                    ? '—'
                    : `${row.deltaScore >= 0 ? '+' : ''}${row.deltaScore.toFixed(3)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Variant Comparison — existing CompareTable logic
// ---------------------------------------------------------------------------

export function CompareTable({
  compareMode,
  entries,
  onCompareModeChange: _onCompareModeChange,
  runs = [],
}: Props) {
  const [sortKey, setSortKey] = useState<null | SortKey>('category')
  const [sortDir, setSortDir] = useState<null | SortDir>('asc')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [hoveredKey, setHoveredKey] = useState<null | string>(null)
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false)

  const pairs = useMemo<ComparePair[]>(() => {
    // Include all entries (QA + Codegen). Untagged entries (pre-dating modelId/systemPromptKey)
    // are treated as qaWithSkill + high-power since those were the only variants run before
    // baseline/low-power were added.
    // Baseline slot: qaNoSkill OR codegenNoSkill — both represent "no skill context injected".
    const byQuestion = new Map<string, ComparePair>()
    for (const entry of entries) {
      const key = entry.result.question
      if (!byQuestion.has(key)) {
        byQuestion.set(key, {
          type: entry.type,
          audience: entry.audience ?? getAudience(entry.category),
          category: entry.category,
          question: key,
        })
      }
      const pair = byQuestion.get(key)!
      const variant = entry.systemPromptKey ?? 'qaWithSkill'

      if (variant === 'qaNoSkill' || variant === 'codegenNoSkill') {
        if (!pair.baseline || entry.systemPromptKey) {
          pair.baseline = entry
        }
      } else {
        // Distinguish high-power (skill) vs low-power by model ID
        if (isHighPower(entry.result.modelId)) {
          if (!pair.skill || entry.result.modelId) {
            pair.skill = entry
          }
        } else {
          if (!pair.lowPower || entry.result.modelId) {
            pair.lowPower = entry
          }
        }
      }
    }
    return Array.from(byQuestion.values()).filter((p) => p.baseline || p.skill || p.lowPower)
  }, [entries])

  const sorted = useMemo(() => {
    const filtered = showOnlyDiffs
      ? pairs.filter((p) => {
          const d = scoreDelta(p)
          return d !== null && Math.abs(d) > 0.005
        })
      : pairs

    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'category') {
        cmp = a.category.localeCompare(b.category) || a.question.localeCompare(b.question)
      } else if (sortKey === 'question') {
        cmp = a.question.localeCompare(b.question)
      } else if (sortKey === 'type') {
        cmp = a.type.localeCompare(b.type) || a.question.localeCompare(b.question)
      } else if (sortKey === 'audience') {
        const aStr = [...a.audience].sort().join(',')
        const bStr = [...b.audience].sort().join(',')
        cmp = aStr.localeCompare(bStr) || a.question.localeCompare(b.question)
      } else if (sortKey === 'delta') {
        const da = scoreDelta(a) ?? -Infinity
        const db = scoreDelta(b) ?? -Infinity
        cmp = db - da
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [pairs, sortKey, sortDir, showOnlyDiffs])

  const stats = useMemo(() => {
    const withBoth = pairs.filter((p) => p.baseline && p.skill)
    const improved = withBoth.filter((p) => (scoreDelta(p) ?? 0) > 0.005).length
    const regressed = withBoth.filter((p) => (scoreDelta(p) ?? 0) < -0.005).length
    const same = withBoth.length - improved - regressed
    const baselineOnly = pairs.filter((p) => p.baseline && !p.skill).length
    const skillOnly = pairs.filter((p) => !p.baseline && p.skill).length

    const skillPassRate =
      withBoth.length > 0
        ? Math.round((withBoth.filter((p) => p.skill?.result.pass).length / withBoth.length) * 100)
        : null
    const baselinePassRate =
      withBoth.length > 0
        ? Math.round(
            (withBoth.filter((p) => p.baseline?.result.pass).length / withBoth.length) * 100,
          )
        : null

    const avgDelta =
      withBoth.length > 0
        ? withBoth.reduce((s, p) => s + (scoreDelta(p) ?? 0), 0) / withBoth.length
        : null

    return {
      avgDelta,
      baselineOnly,
      baselinePassRate,
      improved,
      regressed,
      same,
      skillOnly,
      skillPassRate,
      total: withBoth.length,
    }
  }, [pairs])

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      const next = cycleSort(sortDir)
      setSortDir(next)
      if (next === null) {
        setSortKey(null)
      }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return <span style={{ color: 'var(--theme-elevation-300)', marginLeft: '3px' }}>⇅</span>
    }
    return (
      <span style={{ color: 'var(--theme-elevation-600)', marginLeft: '3px' }}>
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  const colHeaderStyle = (key: SortKey): React.CSSProperties => ({
    alignItems: 'center',
    color: sortKey === key ? 'var(--theme-elevation-800)' : 'var(--theme-elevation-500)',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    userSelect: 'none',
  })

  if (pairs.length === 0 && compareMode === 'variant') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--base)' }}>
        <div
          style={{
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-m)',
            color: 'var(--theme-elevation-500)',
            fontSize: '0.875rem',
            padding: 'calc(var(--base) * 3)',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 8px' }}>
            No paired results found yet. Compare requires at least one entry tagged with{' '}
            <code>systemPromptKey</code>.
          </p>
          <p style={{ color: 'var(--theme-elevation-400)', fontSize: '0.8rem', margin: 0 }}>
            Re-run the evals to populate tags: <code>pnpm run test:eval</code> and{' '}
            <code>pnpm run test:eval:baseline</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--base)' }}>
      {compareMode === 'run' && <RunDiffView runs={runs} />}

      {compareMode === 'variant' && (
        <>
          <style>{`
        @keyframes eval-glow-pulse {
          0%, 100% { outline-color: #1d7aff; box-shadow: 0 0 5px 2px rgba(29,122,255,0.5); }
          50%       { outline-color: #00c8aa; box-shadow: 0 0 10px 4px rgba(0,200,170,0.55), 0 0 5px 2px rgba(29,122,255,0.3); }
        }
        .eval-improved-badge {
          animation: eval-glow-pulse 2s ease infinite;
          outline: 1px solid #1d7aff;
          outline-offset: 0;
        }
      `}</style>
          {/* Summary strip */}
          <div
            style={{
              background: 'var(--theme-elevation-50)',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-m)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0',
            }}
          >
            {[
              { label: 'Pairs Compared', value: `${stats.total}` },
              {
                color: 'var(--theme-success-600)',
                label: 'Improved w/ Skill',
                value: `${stats.improved}`,
              },
              { color: 'var(--theme-elevation-600)', label: 'Unchanged', value: `${stats.same}` },
              {
                color: stats.regressed > 0 ? 'var(--theme-error-600)' : undefined,
                label: 'Regressed',
                value: `${stats.regressed}`,
              },
              {
                color:
                  stats.avgDelta !== null
                    ? stats.avgDelta > 0
                      ? 'var(--theme-success-600)'
                      : stats.avgDelta < 0
                        ? 'var(--theme-error-600)'
                        : undefined
                    : undefined,
                label: 'Avg Δ Score',
                value:
                  stats.avgDelta !== null
                    ? `${stats.avgDelta > 0 ? '+' : ''}${stats.avgDelta.toFixed(3)}`
                    : '—',
              },
              {
                label: 'Pass Rate',
                value:
                  stats.baselinePassRate !== null
                    ? `${stats.baselinePassRate}% → ${stats.skillPassRate}%`
                    : '—',
              },
            ].map(({ color, label, value }, i, arr) => (
              <div
                key={label}
                style={{
                  borderRight:
                    i < arr.length - 1 ? '1px solid var(--theme-elevation-150)' : undefined,
                  flex: '1 1 auto',
                  padding: '12px 16px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    color: 'var(--theme-elevation-500)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    color: color ?? 'var(--theme-elevation-900)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <label
              htmlFor="run-diff-show-only-diffs"
              style={{
                alignItems: 'center',
                color: 'var(--theme-elevation-700)',
                cursor: 'pointer',
                display: 'flex',
                fontSize: '0.8rem',
                gap: '6px',
              }}
            >
              <input
                aria-label="Show only differences"
                checked={showOnlyDiffs}
                id="run-diff-show-only-diffs"
                onChange={(e) => setShowOnlyDiffs(e.target.checked)}
                type="checkbox"
              />
              Show only differences
            </label>
            {stats.baselineOnly + stats.skillOnly > 0 && (
              <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.75rem' }}>
                · {stats.baselineOnly + stats.skillOnly} question
                {stats.baselineOnly + stats.skillOnly !== 1 ? 's' : ''} with only one variant (shown
                below)
              </span>
            )}
          </div>

          {/* Table */}
          <div
            style={{
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-m)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'var(--theme-elevation-50)',
                borderBottom: '1px solid var(--theme-elevation-150)',
                display: 'grid',
                gap: '0 12px',
                gridTemplateColumns: '1fr 80px 60px 110px 130px 130px 130px 90px 32px',
                padding: '8px 12px',
              }}
            >
              <span
                onClick={() => handleSort('question')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('question')}
                role="button"
                style={colHeaderStyle('question')}
                tabIndex={0}
              >
                Question{sortIndicator('question')}
              </span>
              <span
                onClick={() => handleSort('category')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('category')}
                role="button"
                style={colHeaderStyle('category')}
                tabIndex={0}
              >
                Category{sortIndicator('category')}
              </span>
              <span
                onClick={() => handleSort('type')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('type')}
                role="button"
                style={colHeaderStyle('type')}
                tabIndex={0}
              >
                Type{sortIndicator('type')}
              </span>
              <span
                onClick={() => handleSort('audience')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('audience')}
                role="button"
                style={colHeaderStyle('audience')}
                tabIndex={0}
              >
                Audience{sortIndicator('audience')}
              </span>
              <span
                style={{
                  color: 'var(--color-warning-500, #e8a838)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Low Power
              </span>
              <span
                style={{
                  borderLeft: '2px solid var(--theme-elevation-200)',
                  color: 'var(--theme-elevation-500)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  paddingLeft: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Baseline
              </span>
              <span
                style={{
                  color: 'var(--theme-success-700)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                With Skill
              </span>
              <span
                onClick={() => handleSort('delta')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('delta')}
                role="button"
                style={colHeaderStyle('delta')}
                tabIndex={0}
              >
                Δ Score{sortIndicator('delta')}
              </span>
              <span />
            </div>

            {sorted.length === 0 ? (
              <div
                style={{
                  color: 'var(--theme-elevation-400)',
                  fontSize: '0.85rem',
                  padding: 'calc(var(--base) * 2)',
                  textAlign: 'center',
                }}
              >
                No differences found.
              </div>
            ) : (
              sorted.map((pair, i) => {
                const rowKey = pair.question
                const isExpanded = expanded.has(rowKey)
                const isLast = i === sorted.length - 1
                const delta = scoreDelta(pair)
                const shortQuestion =
                  pair.question.length > 80 ? pair.question.slice(0, 80) + '…' : pair.question

                return (
                  <div
                    key={rowKey}
                    style={{
                      borderBottom: isLast ? undefined : '1px solid var(--theme-elevation-100)',
                    }}
                  >
                    <div
                      onClick={() => toggleExpand(rowKey)}
                      onKeyDown={(e) =>
                        (e.key === 'Enter' || e.key === ' ') && toggleExpand(rowKey)
                      }
                      onMouseEnter={() => !isExpanded && setHoveredKey(rowKey)}
                      onMouseLeave={() => setHoveredKey(null)}
                      role="button"
                      style={{
                        alignItems: 'center',
                        background: isExpanded
                          ? 'var(--theme-elevation-50)'
                          : hoveredKey === rowKey
                            ? 'var(--theme-elevation-100)'
                            : undefined,
                        cursor: 'pointer',
                        display: 'grid',
                        gap: '0 12px',
                        gridTemplateColumns: '1fr 80px 60px 110px 130px 130px 130px 90px 32px',
                        padding: '10px 12px',
                        transition: 'background 0.1s',
                      }}
                      tabIndex={0}
                    >
                      <span
                        style={{
                          color: 'var(--theme-elevation-800)',
                          fontSize: '0.82rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={pair.question}
                      >
                        {shortQuestion}
                      </span>
                      <span
                        style={{
                          background: 'var(--theme-elevation-100)',
                          borderRadius: '4px',
                          color: 'var(--theme-elevation-800)',
                          display: 'inline-block',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          letterSpacing: '0.03em',
                          padding: '2px 6px',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pair.category}
                      </span>
                      <span>
                        <TypeBadge type={pair.type} />
                      </span>
                      <span>
                        <AudienceBadges audiences={pair.audience} />
                      </span>
                      <ResultCell entry={pair.lowPower} />
                      <ResultCell borderLeft entry={pair.baseline} />
                      <ResultCell entry={pair.skill} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <DeltaBadge delta={delta} glow={delta !== null && delta > 0.005} />
                        {delta !== null && (
                          <span
                            style={{
                              color:
                                delta > 0.005
                                  ? 'var(--theme-success-600)'
                                  : delta < -0.005
                                    ? 'var(--theme-error-500)'
                                    : 'var(--theme-elevation-400)',
                              fontSize: '0.7rem',
                            }}
                          >
                            {delta > 0.005
                              ? 'improved'
                              : delta < -0.005
                                ? 'regressed'
                                : 'unchanged'}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          color: 'var(--theme-elevation-400)',
                          fontSize: '0.8rem',
                          textAlign: 'center',
                        }}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>

                    {isExpanded && <ExpandedCompareRow pair={pair} />}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
