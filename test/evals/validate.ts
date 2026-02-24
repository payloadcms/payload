import { exec } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import type { ValidateResult } from './types.js'

const execAsync = promisify(exec)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const evalResultsDir = path.join(__dirname, 'eval-results')
const fixturesDir = path.join(__dirname, 'fixtures')
const tscBin = path.resolve(__dirname, '..', '..', 'node_modules', '.bin', 'tsc')

/**
 * Serializes all tsc invocations within this worker so only one compiler process runs at a time.
 * Cross-worker parallelism is bounded by maxForks in vitest.config.ts (set to 4),
 * so the effective maximum of concurrent tsc processes across the full suite is 4.
 * LLM calls remain fully parallel (network I/O); only this CPU-heavy step is gated.
 */
class Semaphore {
  private readonly queue: Array<() => void> = []
  private running = 0

  constructor(private readonly limit: number) {}

  private acquire(): Promise<void> {
    if (this.running < this.limit) {
      this.running++
      return Promise.resolve()
    }
    return new Promise((resolve) => this.queue.push(resolve))
  }

  private release(): void {
    this.running--
    const next = this.queue.shift()
    if (next) {
      this.running++
      next()
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

const tscSemaphore = new Semaphore(1)

/**
 * Type-checks the given TypeScript config content in an isolated sandbox.
 *
 * The generated file is written to eval-results/<name>.ts so developers can
 * inspect the LLM output after a run. The per-invocation tsconfig is cleaned
 * up automatically; the .ts file is intentionally kept for review.
 *
 * @param configContent - The LLM-generated payload.config.ts source
 * @param name - A path-like identifier matching the fixture (e.g. "collections/codegen/posts-title-content")
 */
export async function validateConfigTypes(
  configContent: string,
  name: string,
): Promise<ValidateResult> {
  const outputDir = path.join(evalResultsDir, path.dirname(name))
  mkdirSync(outputDir, { recursive: true })

  const baseName = path.basename(name)
  const configFileName = `${baseName}.ts`
  // Unique per invocation so concurrent spec files don't collide on the same tsconfig path.
  const invocationId = Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
  const tsconfigFileName = `${baseName}.${invocationId}.tsconfig.json`
  const configFilePath = path.join(outputDir, configFileName)
  const tsconfigFilePath = path.join(outputDir, tsconfigFileName)

  const relToFixtures = path.relative(outputDir, fixturesDir).replace(/\\/g, '/')
  const tsconfig = {
    extends: `${relToFixtures}/tsconfig.json`,
    compilerOptions: { noEmit: true },
    include: [configFileName],
  }

  writeFileSync(configFilePath, configContent, 'utf-8')
  writeFileSync(tsconfigFilePath, JSON.stringify(tsconfig, null, 2), 'utf-8')

  return tscSemaphore.run(async () => {
    try {
      await execAsync(`"${tscBin}" -p "${tsconfigFilePath}"`, { cwd: outputDir })
      return { valid: true, errors: [] }
    } catch (err) {
      const e = err as { stderr?: string; stdout?: string } & NodeJS.ErrnoException
      const raw = [e.stdout, e.stderr].filter(Boolean).join('\n')
      const errors = raw
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean)
      return { valid: false, errors }
    } finally {
      rmSync(tsconfigFilePath, { force: true })
    }
  })
}
