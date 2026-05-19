import type { Project } from 'ts-morph'

import { IndentationText, NewLineKind, QuoteKind } from 'ts-morph'

import type { Transform, TransformResult } from './types.js'

export type RunTransformsArgs = {
  project: Project
  transforms: Transform[]
}

export type TransformRunResult = {
  error?: Error
  name: string
} & TransformResult

export type RunTransformsResult = {
  failed: boolean
  results: TransformRunResult[]
}

export async function runTransforms({
  project,
  transforms,
}: RunTransformsArgs): Promise<RunTransformsResult> {
  project.manipulationSettings.set({
    indentationText: IndentationText.TwoSpaces,
    newLineKind: NewLineKind.LineFeed,
    quoteKind: QuoteKind.Single,
    useTrailingCommas: true,
  })

  const results: TransformRunResult[] = []
  let failed = false

  for (const transform of transforms) {
    try {
      const result = await transform.apply({ project })
      results.push({ name: transform.name, ...result })
    } catch (err) {
      failed = true
      const error = err instanceof Error ? err : new Error(String(err))
      results.push({ name: transform.name, error, filesChanged: [] })
    }
  }

  return { failed, results }
}
