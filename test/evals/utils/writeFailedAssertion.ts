import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AuditEvent } from '../../__helpers/plugins/audit/index.js'
import type { TranscriptEvent } from '../types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const evalResultsDir = path.join(__dirname, '..', 'eval-results', 'failed-assertions')

function labelToSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export type FailedCodegenAssertion = {
  agentExitCode?: number
  agentLog?: string
  audit?: AuditEvent[]
  category: string
  changeDescription?: string
  confidence: number
  configPath: string
  label: string
  modifiedConfig: string
  paramsHash: string
  question: string
  reasoning: string
  starterConfig: string
  transcript?: TranscriptEvent[]
  tscErrors?: string[]
}

export function writeFailedCodegenAssertion(data: FailedCodegenAssertion): void {
  const dir = path.join(evalResultsDir, labelToSlug(data.label))
  mkdirSync(dir, { recursive: true })
  const fileName = `${data.paramsHash}.json`
  writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2), 'utf-8')
}
