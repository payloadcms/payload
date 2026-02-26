'use client'

import React, { useMemo, useState } from 'react'

import type { EvalEntry } from './index.js'

import { CompareTable } from './CompareTable.js'

type Variant = 'baseline' | 'low-power' | 'skill'

function getVariant(entry: EvalEntry): null | Variant {
  if (entry.result.systemPromptKey === 'qaNoSkill') {
    return 'baseline'
  }
  const { modelId } = entry.result
  if (!modelId) {
    return null
  }
  const isHighPower =
    modelId.includes('gpt-5') || modelId.includes('o3') || modelId.includes('claude-3-5')
  return isHighPower ? 'skill' : 'low-power'
}

function VariantBadge({ variant }: { variant: null | Variant }) {
  if (!variant) {
    return <span style={{ color: 'var(--theme-elevation-300)', fontSize: '0.72rem' }}>—</span>
  }
  const config: Record<Variant, { bg: string; color: string; label: string }> = {
    baseline: {
      bg: 'var(--theme-elevation-100)',
      color: 'var(--theme-elevation-600)',
      label: 'Baseline',
    },
    'low-power': { bg: 'rgba(232,168,56,0.15)', color: '#e8a838', label: 'Low Power' },
    skill: { bg: 'var(--theme-success-100)', color: 'var(--theme-success-700)', label: 'Skill' },
  }
  const { bg, color, label } = config[variant]
  return (
    <span
      style={{
        background: bg,
        borderRadius: '4px',
        color,
        fontSize: '0.7rem',
        fontWeight: 600,
        padding: '2px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

type Props = {
  adminRoute: string
  entries: EvalEntry[]
}

type ViewMode = 'compare' | 'list'

type FilterStatus = 'all' | 'fail' | 'pass'
type FilterType = 'all' | 'codegen' | 'qa'

function ScoreBadge({ pass, score }: { pass: boolean; score?: number }) {
  const color = pass ? 'var(--theme-success-500)' : 'var(--theme-error-500)'
  const bg = pass ? 'var(--theme-success-100)' : 'var(--theme-error-100)'
  return (
    <span
      style={{
        background: bg,
        borderRadius: '4px',
        color,
        display: 'inline-block',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {pass ? '✓ PASS' : '✗ FAIL'}
      {score !== undefined ? ` · ${score.toFixed(2)}` : ''}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      style={{
        background: 'var(--theme-elevation-100)',
        borderRadius: '4px',
        color: 'var(--theme-elevation-800)',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        padding: '2px 6px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {category}
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

function TokenDisplay({
  total,
}: {
  total?: { cachedInputTokens: number; inputTokens: number; totalTokens: number }
}) {
  if (!total) {
    return <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.75rem' }}>—</span>
  }
  const cachedRatio = total.inputTokens > 0 ? total.cachedInputTokens / total.inputTokens : 0
  return (
    <span
      style={{ color: 'var(--theme-elevation-600)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
    >
      {total.totalTokens.toLocaleString()}
      {cachedRatio > 0 && (
        <span
          style={{
            background: 'var(--theme-success-100)',
            borderRadius: '3px',
            color: 'var(--theme-success-600)',
            fontSize: '0.65rem',
            marginLeft: '4px',
            padding: '1px 4px',
          }}
          title={`${total.cachedInputTokens} tokens served from cache`}
        >
          {Math.round(cachedRatio * 100)}% cached
        </span>
      )}
    </span>
  )
}

function ExpandedRow({ entry }: { entry: EvalEntry }) {
  const { result } = entry
  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  }
  const labelStyle: React.CSSProperties = {
    color: 'var(--theme-elevation-500)',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  }
  const valueStyle: React.CSSProperties = {
    background: 'var(--theme-elevation-50)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: '4px',
    fontSize: '0.8rem',
    lineHeight: 1.6,
    padding: '8px 10px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--theme-elevation-100)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px 12px',
      }}
    >
      {/* Question / Task */}
      <div style={sectionStyle}>
        <span style={labelStyle}>{entry.type === 'codegen' ? 'Task' : 'Question'}</span>
        <span style={valueStyle}>{result.question}</span>
      </div>

      {/* QA: Answer */}
      {entry.type === 'qa' && result.answer && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Answer</span>
          <span style={valueStyle}>{result.answer}</span>
        </div>
      )}

      {/* Codegen: Change Description */}
      {entry.type === 'codegen' && result.changeDescription && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Change Description</span>
          <span style={valueStyle}>{result.changeDescription}</span>
        </div>
      )}

      {/* TSC Errors */}
      {result.tscErrors && result.tscErrors.length > 0 && (
        <div style={sectionStyle}>
          <span style={{ ...labelStyle, color: 'var(--theme-error-500)' }}>
            TypeScript Errors ({result.tscErrors.length})
          </span>
          <span
            style={{
              ...valueStyle,
              background: 'var(--theme-error-50)',
              border: '1px solid var(--theme-error-200)',
              color: 'var(--theme-error-700)',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}
          >
            {result.tscErrors.join('\n')}
          </span>
        </div>
      )}

      {/* Reasoning */}
      {result.reasoning && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Reasoning</span>
          <span style={valueStyle}>{result.reasoning}</span>
        </div>
      )}

      {/* Usage breakdown */}
      {result.usage && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Token Usage</span>
          <div
            style={{
              display: 'grid',
              fontSize: '0.75rem',
              gap: '4px 16px',
              gridTemplateColumns: 'max-content 1fr',
            }}
          >
            {result.usage.runner && (
              <>
                <span style={{ color: 'var(--theme-elevation-500)' }}>Runner</span>
                <span>
                  {result.usage.runner.inputTokens.toLocaleString()} in /{' '}
                  {result.usage.runner.outputTokens.toLocaleString()} out ={' '}
                  {result.usage.runner.totalTokens.toLocaleString()} total
                </span>
              </>
            )}
            {result.usage.scorer && (
              <>
                <span style={{ color: 'var(--theme-elevation-500)' }}>Scorer</span>
                <span>
                  {result.usage.scorer.inputTokens.toLocaleString()} in /{' '}
                  {result.usage.scorer.outputTokens.toLocaleString()} out ={' '}
                  {result.usage.scorer.totalTokens.toLocaleString()} total
                </span>
              </>
            )}
            <span style={{ color: 'var(--theme-elevation-500)' }}>Total</span>
            <span style={{ fontWeight: 600 }}>
              {result.usage.total.totalTokens.toLocaleString()} tokens
              {result.usage.total.cachedInputTokens > 0 && (
                <span style={{ color: 'var(--theme-success-600)', fontWeight: 400 }}>
                  {' '}
                  ({result.usage.total.cachedInputTokens.toLocaleString()} from cache)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Cached at */}
      <div style={{ color: 'var(--theme-elevation-400)', fontSize: '0.7rem', marginTop: '4px' }}>
        Cached {new Date(entry.createdAt).toLocaleString()} · hash {entry.hash.slice(0, 12)}…
      </div>
    </div>
  )
}

type SortKey = 'category' | 'question' | 'result' | 'tokens' | 'type' | 'variant'
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

export function ResultsTable({ entries }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [hoveredHash, setHoveredHash] = useState<null | string>(null)
  const [sortKey, setSortKey] = useState<null | SortKey>(null)
  const [sortDir, setSortDir] = useState<null | SortDir>(null)

  const comparablePairs = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.type === 'qa' &&
          (e.systemPromptKey === 'qaWithSkill' || e.systemPromptKey === 'qaNoSkill'),
      ).length,
    [entries],
  )

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(entries.map((e) => e.category))).sort()],
    [entries],
  )

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
      return null
    }
    return (
      <span style={{ color: 'var(--theme-elevation-600)', marginLeft: '3px' }}>
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  const filtered = useMemo(() => {
    const base = entries.filter((e) => {
      if (statusFilter === 'pass' && !e.result.pass) {
        return false
      }
      if (statusFilter === 'fail' && e.result.pass) {
        return false
      }
      if (typeFilter !== 'all' && e.type !== typeFilter) {
        return false
      }
      if (categoryFilter !== 'all' && e.category !== categoryFilter) {
        return false
      }
      return true
    })

    if (!sortKey || !sortDir) {
      return base
    }

    const dir = sortDir === 'asc' ? 1 : -1
    return [...base].sort((a, b) => {
      let aVal = ''
      let bVal = ''
      if (sortKey === 'question') {
        aVal = a.result.question.toLowerCase()
        bVal = b.result.question.toLowerCase()
      } else if (sortKey === 'category') {
        aVal = a.category.toLowerCase()
        bVal = b.category.toLowerCase()
      } else if (sortKey === 'type') {
        aVal = a.type
        bVal = b.type
      } else if (sortKey === 'variant') {
        aVal = getVariant(a) ?? ''
        bVal = getVariant(b) ?? ''
      } else if (sortKey === 'result') {
        aVal = a.result.pass ? 'pass' : 'fail'
        bVal = b.result.pass ? 'pass' : 'fail'
      } else if (sortKey === 'tokens') {
        const aTokens = a.result.usage?.total.totalTokens ?? 0
        const bTokens = b.result.usage?.total.totalTokens ?? 0
        return (aTokens - bTokens) * dir
      }
      return aVal < bVal ? -dir : aVal > bVal ? dir : 0
    })
  }, [entries, statusFilter, typeFilter, categoryFilter, sortKey, sortDir])

  // Summary stats from filtered set
  const stats = useMemo(() => {
    const passed = filtered.filter((e) => e.result.pass).length
    const scored = filtered.filter((e) => e.result.score !== undefined)
    const avgScore =
      scored.length > 0
        ? scored.reduce((s, e) => s + (e.result.score ?? 0), 0) / scored.length
        : null
    const totalTokens = filtered.reduce((s, e) => s + (e.result.usage?.total.totalTokens ?? 0), 0)
    const totalCached = filtered.reduce(
      (s, e) => s + (e.result.usage?.total.cachedInputTokens ?? 0),
      0,
    )
    const totalInput = filtered.reduce((s, e) => s + (e.result.usage?.total.inputTokens ?? 0), 0)
    return { avgScore, passed, totalCached, totalInput, totalTokens }
  }, [filtered])

  const toggleExpand = (hash: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(hash)) {
        next.delete(hash)
      } else {
        next.add(hash)
      }
      return next
    })
  }

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--theme-elevation-900)' : 'transparent',
    border: '1px solid var(--theme-elevation-200)',
    borderRadius: '4px',
    color: active ? 'var(--theme-elevation-0)' : 'var(--theme-elevation-700)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: active ? 600 : 400,
    padding: '4px 12px',
  })

  const passRate = filtered.length > 0 ? Math.round((stats.passed / filtered.length) * 100) : 0
  const cachedRatio =
    stats.totalInput > 0 ? Math.round((stats.totalCached / stats.totalInput) * 100) : 0

  const viewBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--theme-elevation-900)' : 'transparent',
    border: '1px solid var(--theme-elevation-300)',
    borderRadius: '4px',
    color: active ? 'var(--theme-elevation-0)' : 'var(--theme-elevation-700)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: active ? 600 : 400,
    padding: '5px 14px',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--base)' }}>
      {/* View mode toggle */}
      <div style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
        <button onClick={() => setViewMode('list')} style={viewBtnStyle(viewMode === 'list')}>
          All Results
        </button>
        <button
          onClick={() => setViewMode('compare')}
          style={{
            ...viewBtnStyle(viewMode === 'compare'),
            alignItems: 'center',
            display: 'inline-flex',
            gap: '6px',
          }}
        >
          Compare Results
        </button>
        {comparablePairs === 0 && viewMode === 'compare' && (
          <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.75rem' }}>
            · Re-run evals to populate comparison data
          </span>
        )}
      </div>

      {viewMode === 'compare' && <CompareTable entries={entries} />}
      {viewMode === 'list' && (
        <>
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
              { label: 'Total', value: `${filtered.length}` },
              {
                color: passRate >= 70 ? 'var(--theme-success-600)' : 'var(--theme-error-600)',
                label: 'Pass Rate',
                value: `${passRate}%`,
              },
              {
                label: 'Avg Score',
                value: stats.avgScore !== null ? stats.avgScore.toFixed(2) : '—',
              },
              {
                label: 'Total Tokens',
                value: stats.totalTokens > 0 ? stats.totalTokens.toLocaleString() : '—',
              },
              {
                color: cachedRatio > 0 ? 'var(--theme-success-600)' : undefined,
                label: 'Cache Hit',
                value: cachedRatio > 0 ? `${cachedRatio}%` : '—',
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
                    fontSize: '1.15rem',
                    fontWeight: 700,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'pass', 'fail'] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={filterBtnStyle(statusFilter === s)}
                >
                  {s === 'all' ? 'All' : s === 'pass' ? '✓ Passed' : '✗ Failed'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'qa', 'codegen'] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={filterBtnStyle(typeFilter === t)}
                >
                  {t === 'all' ? 'QA + Codegen' : t === 'qa' ? 'QA only' : 'Codegen only'}
                </button>
              ))}
            </div>

            <select
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                background: 'var(--theme-elevation-0)',
                border: '1px solid var(--theme-elevation-200)',
                borderRadius: '4px',
                color: 'var(--theme-elevation-700)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '4px 10px',
              }}
              value={categoryFilter}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div
            style={{
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-m)',
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <div
              style={{
                background: 'var(--theme-elevation-50)',
                borderBottom: '1px solid var(--theme-elevation-150)',
                display: 'grid',
                fontSize: '0.7rem',
                fontWeight: 700,
                gap: '0 12px',
                gridTemplateColumns: '1fr 100px 70px 80px 100px 100px 32px',
                letterSpacing: '0.05em',
                padding: '8px 12px',
                textTransform: 'uppercase',
              }}
            >
              {(['question', 'category', 'type', 'variant', 'result', 'tokens'] as SortKey[]).map(
                (key) => (
                  <span
                    key={key}
                    onClick={() => handleSort(key)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort(key)}
                    role="button"
                    style={{
                      alignItems: 'center',
                      color:
                        sortKey === key
                          ? 'var(--theme-elevation-800)'
                          : 'var(--theme-elevation-500)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      userSelect: 'none',
                    }}
                    tabIndex={0}
                  >
                    {key === 'question'
                      ? 'Question / Task'
                      : key.charAt(0).toUpperCase() + key.slice(1)}
                    {sortIndicator(key)}
                  </span>
                ),
              )}
              <span />
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  color: 'var(--theme-elevation-400)',
                  fontSize: '0.85rem',
                  padding: 'calc(var(--base) * 2)',
                  textAlign: 'center',
                }}
              >
                No results match the current filters.
              </div>
            ) : (
              filtered.map((entry, i) => {
                const isExpanded = expanded.has(entry.hash)
                const isLast = i === filtered.length - 1
                const shortQuestion =
                  entry.result.question.length > 90
                    ? entry.result.question.slice(0, 90) + '…'
                    : entry.result.question

                return (
                  <div
                    key={entry.hash}
                    style={{
                      borderBottom: isLast ? undefined : '1px solid var(--theme-elevation-100)',
                    }}
                  >
                    <div
                      onClick={() => toggleExpand(entry.hash)}
                      onKeyDown={(e) =>
                        (e.key === 'Enter' || e.key === ' ') && toggleExpand(entry.hash)
                      }
                      onMouseEnter={() => !isExpanded && setHoveredHash(entry.hash)}
                      onMouseLeave={() => setHoveredHash(null)}
                      role="button"
                      style={{
                        alignItems: 'center',
                        background: isExpanded
                          ? 'var(--theme-elevation-50)'
                          : hoveredHash === entry.hash
                            ? 'var(--theme-elevation-100)'
                            : undefined,
                        cursor: 'pointer',
                        display: 'grid',
                        gap: '0 12px',
                        gridTemplateColumns: '1fr 100px 70px 80px 100px 100px 32px',
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
                        title={entry.result.question}
                      >
                        {shortQuestion}
                      </span>
                      <span>
                        <CategoryBadge category={entry.category} />
                      </span>
                      <span>
                        <TypeBadge type={entry.type} />
                      </span>
                      <span>
                        <VariantBadge variant={getVariant(entry)} />
                      </span>
                      <span>
                        <ScoreBadge pass={entry.result.pass} score={entry.result.score} />
                      </span>
                      <span>
                        <TokenDisplay total={entry.result.usage?.total} />
                      </span>
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

                    {isExpanded && <ExpandedRow entry={entry} />}
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
