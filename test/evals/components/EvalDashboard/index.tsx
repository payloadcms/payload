import type { AdminViewServerProps } from 'payload'

import LinkImport from 'next/link.js'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'

import './codeDiff.scss'

import type { EvalResult, SystemPromptKey } from '../../types.js'
import type { Audience } from './audience.js'
import type { RenderedCode } from './codeDiff.js'

import { collectionsCodegenDataset } from '../../datasets/collections/codegen.js'
import { configCodegenDataset } from '../../datasets/config/codegen.js'
import { fieldsCodegenDataset } from '../../datasets/fields/codegen.js'
import { negativeCorrectionCodegenDataset } from '../../datasets/negative/codegen.js'
import { pluginsCodegenDataset } from '../../datasets/plugins/codegen.js'
import { pluginsOfficialCodegenDataset } from '../../datasets/plugins/official/codegen.js'
import { getAudience } from './audience.js'
import { renderCodegenDiff, renderCodegenFile } from './codeDiff.js'
import { ResultsTable } from './ResultsTable.js'

const codegenFixtureByQuestion: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const ds of [
    collectionsCodegenDataset,
    configCodegenDataset,
    fieldsCodegenDataset,
    negativeCorrectionCodegenDataset,
    pluginsCodegenDataset,
    pluginsOfficialCodegenDataset,
  ]) {
    for (const c of ds) {
      map[c.input] = c.fixturePath
    }
  }
  return map
})()

export type RunSnapshotResult = {
  category: string
  pass: boolean
  question: string
  score?: number
  type: 'codegen' | 'qa'
}

export type RunSnapshot = {
  /** e.g. "skill/001-2026-02-28T10-00.json" */
  filename: string
  generatedAt: string
  results: RunSnapshotResult[]
  run: number
  summary: { avgScore: number; passed: number; passRate: number; total: number }
  variant: string
}

const Link = 'default' in LinkImport ? LinkImport.default : LinkImport

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cacheDir = path.resolve(__dirname, '../../eval-results/cache')
const fixturesDir = path.resolve(__dirname, '../../fixtures')

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

const runsBaseDir = path.resolve(__dirname, '../../eval-results/runs')

function readRunSnapshots(): RunSnapshot[] {
  const snapshots: RunSnapshot[] = []
  let variants: string[]
  try {
    variants = readdirSync(runsBaseDir)
  } catch {
    return []
  }
  for (const variant of variants) {
    const variantDir = path.join(runsBaseDir, variant)
    let files: string[]
    try {
      files = readdirSync(variantDir)
        .filter((f) => f.endsWith('.json'))
        .sort()
    } catch {
      continue
    }
    for (const file of files) {
      try {
        const raw = JSON.parse(readFileSync(path.join(variantDir, file), 'utf-8'))
        snapshots.push({ ...raw, filename: `${variant}/${file}` })
      } catch {
        // skip corrupt snapshot files
      }
    }
  }
  return snapshots
}

async function buildCodegenHtml(entries: EvalEntry[]): Promise<Record<string, RenderedCode>> {
  const out: Record<string, RenderedCode> = {}
  await Promise.all(
    entries
      .filter((e) => e.type === 'codegen')
      .map(async (e) => {
        const modified = e.result.answer ?? ''
        const fixturePath = e.result.fixturePath ?? codegenFixtureByQuestion[e.result.question]
        if (fixturePath) {
          try {
            const starter = readFileSync(
              path.join(fixturesDir, fixturePath, 'payload.config.ts'),
              'utf-8',
            )
            out[e.hash] = await renderCodegenDiff({ modified, starter })
            return
          } catch {
            // fall through to file render
          }
        }
        out[e.hash] = await renderCodegenFile({ modified })
      }),
  )
  return out
}

export async function EvalDashboardView({ initPageResult }: AdminViewServerProps) {
  const entries = readCacheEntries()
  const runs = readRunSnapshots()
  const codegenHtml = await buildCodegenHtml(entries)
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
        <ResultsTable
          adminRoute={adminRoute}
          codegenHtml={codegenHtml}
          entries={entries}
          runs={runs}
        />
      )}
    </div>
  )
}
