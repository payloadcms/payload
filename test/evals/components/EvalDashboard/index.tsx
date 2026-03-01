import type { AdminViewServerProps } from 'payload'

import LinkImport from 'next/link.js'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'

import type { EvalResult, SystemPromptKey } from '../../types.js'
import type { Audience } from './audience.js'

import { getAudience } from './audience.js'
import { ResultsTable } from './ResultsTable.js'

const Link = 'default' in LinkImport ? LinkImport.default : LinkImport

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cacheDir = path.resolve(__dirname, '../../eval-results/cache')

type CacheEntry = {
  createdAt: string
  result: EvalResult
  version: 1
}

export type EvalEntry = {
  audience: Audience[]
  category: string
  createdAt: string
  hash: string
  result: EvalResult
  systemPromptKey?: SystemPromptKey
  type: 'codegen' | 'qa'
}

function readCacheEntries(): EvalEntry[] {
  let files: string[]
  try {
    files = readdirSync(cacheDir).filter((f) => f.endsWith('.json'))
  } catch {
    return []
  }

  const entries: EvalEntry[] = []
  for (const file of files) {
    try {
      const raw = readFileSync(path.join(cacheDir, file), 'utf-8')
      const entry = JSON.parse(raw) as CacheEntry
      if (entry.version !== 1) {
        continue
      }
      const { result } = entry
      const isCodegen = result.changeDescription !== undefined || Boolean(result.tscErrors?.length)
      entries.push({
        type: isCodegen ? 'codegen' : 'qa',
        audience: getAudience(result.category),
        category: result.category,
        createdAt: entry.createdAt,
        hash: file.replace('.json', ''),
        result,
        systemPromptKey: result.systemPromptKey,
      })
    } catch {
      // skip corrupt entries
    }
  }

  return entries.sort((a, b) => a.category.localeCompare(b.category))
}

export function EvalDashboardView({ initPageResult }: AdminViewServerProps) {
  const entries = readCacheEntries()
  const adminRoute = initPageResult.req.payload.config.routes.admin

  return (
    <div
      style={{
        paddingBottom: 'calc(var(--base) * 4)',
        paddingLeft: 'var(--gutter-h)',
        paddingRight: 'var(--gutter-h)',
        paddingTop: 'calc(var(--base) * 2)',
      }}
    >
      <Link
        href={adminRoute}
        style={{
          alignItems: 'center',
          color: 'var(--theme-elevation-500)',
          display: 'inline-flex',
          fontSize: '0.8rem',
          gap: '4px',
          marginBottom: 'calc(var(--base) * 1.5)',
          textDecoration: 'none',
        }}
      >
        ← Dashboard
      </Link>

      <div
        style={{
          alignItems: 'baseline',
          display: 'flex',
          gap: 'var(--base)',
          marginBottom: 'calc(var(--base) * 1.5)',
        }}
      >
        <h1 style={{ margin: 0 }}>Eval Results</h1>
        <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.875rem' }}>
          {entries.length} cached result{entries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {entries.length === 0 ? (
        <div
          style={{
            background: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-m)',
            color: 'var(--theme-elevation-500)',
            padding: 'calc(var(--base) * 2)',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0 }}>
            No cached results found. Run the eval suite first: <code>pnpm run test:eval</code>
          </p>
        </div>
      ) : (
        <ResultsTable adminRoute={adminRoute} entries={entries} />
      )}
    </div>
  )
}
