import type { AdminViewServerProps } from 'payload'

import LinkImport from 'next/link.js'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import React from 'react'

import './codeDiff.css'

import type { StoredRunResult } from '../../runResults.js'
import type { EvalResult, SystemPromptKey } from '../../types.js'
import type { Audience } from './audience.js'
import type { RenderedCode } from './codeDiff.js'

import { collectionsCodegenDataset } from '../../datasets/collections/codegen.js'
import { configCodegenDataset } from '../../datasets/config/codegen.js'
import { fieldsCodegenDataset } from '../../datasets/fields/codegen.js'
import { negativeCorrectionCodegenDataset } from '../../datasets/negative/codegen.js'
import { pluginsCodegenDataset } from '../../datasets/plugins/codegen.js'
import { pluginsOfficialCodegenDataset } from '../../datasets/plugins/official/codegen.js'
import { readRunResults } from '../../runResults.js'
import { getAudience } from './audience.js'
import { renderCodegenDiff, renderCodegenFile } from './codeDiff.js'
import { runKeyOf } from './configuration.js'
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
      map[c.input] = c.configPath
    }
  }
  return map
})()

export type RunSnapshotResult = {
  category: string
  pass: boolean
  question: string
  score?: number
  type: 'codegen'
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
const fixturesDir = path.resolve(__dirname, '../../fixtures')

export type EvalEntry = {
  audience: Audience[]
  category: string
  createdAt: string
  id: string
  paramsHash: string
  result: { runId: string } & EvalResult
  reusedFromRunId?: string
  systemPromptKey?: SystemPromptKey
  type: 'codegen'
}

function toEvalEntry(entry: StoredRunResult): EvalEntry {
  const { paramsHash, result } = entry
  return {
    id: `${result.runId}:${paramsHash}`,
    type: 'codegen',
    audience: getAudience(result.category),
    category: result.category,
    createdAt: entry.createdAt,
    paramsHash,
    result,
    reusedFromRunId: entry.reusedFromRunId,
    systemPromptKey: result.systemPromptKey,
  }
}

function readEvalEntries(): EvalEntry[] {
  return readRunResults()
    .map(toEvalEntry)
    .sort((a, b) => a.category.localeCompare(b.category))
}

async function buildCodegenHtml(entries: EvalEntry[]): Promise<Record<string, RenderedCode>> {
  const out: Record<string, RenderedCode> = {}
  await Promise.all(
    entries
      .filter((e) => e.type === 'codegen')
      .map(async (e) => {
        const modified = e.result.answer ?? ''
        let starter = e.result.starterContent
        if (!starter) {
          const configPath = e.result.configPath ?? codegenFixtureByQuestion[e.result.question]
          if (configPath) {
            try {
              starter = readFileSync(
                path.join(fixturesDir, configPath, 'payload.config.ts'),
                'utf-8',
              )
            } catch {
              // The fixture was renamed or removed — render the answer alone.
            }
          }
        }
        if (starter !== undefined) {
          out[e.id] = await renderCodegenDiff({ modified, starter })
          return
        }
        out[e.id] = await renderCodegenFile({ modified })
      }),
  )
  return out
}

export async function EvalDashboardView({ initPageResult }: AdminViewServerProps) {
  const entries = readEvalEntries()
  const runCount = new Set(entries.map((e) => runKeyOf(e.result))).size
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
          {entries.length} result{entries.length !== 1 ? 's' : ''} · {runCount} run
          {runCount !== 1 ? 's' : ''}
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
            No results yet. Run the eval suite first: <code>pnpm test:eval</code>
          </p>
        </div>
      ) : (
        <ResultsTable adminRoute={adminRoute} codegenHtml={codegenHtml} entries={entries} />
      )}
    </div>
  )
}
