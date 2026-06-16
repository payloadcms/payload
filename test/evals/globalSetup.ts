import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'payload/node'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function setup() {
  loadEnv()

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('Set OPENAI_API_KEY or ANTHROPIC_API_KEY to run eval tests')
  }

  // Stamp one run id for this invocation. globalSetup runs once in the main
  // process before any worker, so every cached result written by this run reads
  // the same id (see cache.getRunId) and the dashboard groups results by it.
  const resultsDir = path.resolve(__dirname, 'eval-results')
  mkdirSync(resultsDir, { recursive: true })
  writeFileSync(path.join(resultsDir, '.run-id'), new Date().toISOString(), 'utf-8')
}
