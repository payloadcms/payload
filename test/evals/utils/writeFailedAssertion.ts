import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const evalResultsDir = path.join(__dirname, '..', 'eval-results', 'failed-assertions')

function labelToSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export type FailedCodegenAssertion = {
  category: string
  changeDescription?: string
  confidence: number
  fixturePath: string
  label: string
  modifiedConfig: string
  question: string
  reasoning: string
  starterConfig: string
  tscErrors?: string[]
}

export type FailedQAAssertion = {
  answer: string
  category: string
  confidence: number
  expected: string
  label: string
  question: string
  reasoning: string
  /** The broken fixture config injected as context, if any. */
  starterConfig?: string
}

export function writeFailedCodegenAssertion(data: FailedCodegenAssertion): void {
  const dir = path.join(evalResultsDir, labelToSlug(data.label))
  mkdirSync(dir, { recursive: true })
  const fileName = `${path.basename(data.fixturePath)}.json`
  writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2), 'utf-8')
}

export function writeFailedQAAssertion(data: FailedQAAssertion, idx: number): void {
  const dir = path.join(evalResultsDir, labelToSlug(data.label))
  mkdirSync(dir, { recursive: true })
  const slug = data.question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60)
    .replace(/-$/, '')
  const fileName = `${String(idx).padStart(2, '0')}-${slug}.json`
  writeFileSync(path.join(dir, fileName), JSON.stringify(data, null, 2), 'utf-8')
}
