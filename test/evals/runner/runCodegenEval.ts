import type { CodegenRunnerResult } from '../types.js'
import type { CodegenRunner, CodegenRunnerOptions, RunnerKind } from './types.js'

import { claudeCodeRunner } from './claudeCode.js'
import { llmRunner } from './llm.js'

const RUNNERS: Record<RunnerKind, CodegenRunner> = {
  'claude-code': claudeCodeRunner,
  llm: llmRunner,
}

export async function runCodegenEval(
  instruction: string,
  starterConfig: string,
  options: CodegenRunnerOptions = {},
): Promise<CodegenRunnerResult> {
  const kind = options.kind ?? 'llm'
  return RUNNERS[kind].run(instruction, starterConfig, options)
}
