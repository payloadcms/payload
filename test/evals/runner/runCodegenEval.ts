import type { CodegenRunnerResult } from '../types.js'
import type { CodegenRunner, CodegenRunnerOptions, RunnerKind } from './types.js'

import { llmRunner } from './llm.js'

const RUNNERS: Partial<Record<RunnerKind, CodegenRunner>> = {
  llm: llmRunner,
}

export async function runCodegenEval(
  instruction: string,
  starterConfig: string,
  options: CodegenRunnerOptions = {},
): Promise<CodegenRunnerResult> {
  const kind = options.kind ?? 'llm'
  const runner = RUNNERS[kind]
  if (!runner) {
    throw new Error(`Runner not registered: ${kind}`)
  }
  return runner.run(instruction, starterConfig, options)
}
