import { IndentationText, Project, QuoteKind } from 'ts-morph'

import type { Transform } from '../types.js'

import { runTransforms } from '../runner.js'
import { serializePackageJson } from './packageJson.js'

type RunTransformArgs = {
  filename?: string
  source: string
  transform: Transform
}

/**
 * Apply a transform to an in-memory source string and return the resulting source.
 * Used by per-transform tests to drive fixture-pair comparisons.
 */
export async function runTransform({
  filename = 'input.ts',
  source,
  transform,
}: RunTransformArgs): Promise<string> {
  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single,
      useTrailingCommas: true,
    },
    useInMemoryFileSystem: true,
  })
  const file = project.createSourceFile(filename, source)

  await runTransforms({ project, transforms: [transform] })

  return file.getFullText()
}

type RunTransformOnPackageJsonArgs = {
  filename?: string
  source: string
  transform: Transform
}

/**
 * Apply a transform to an in-memory package.json string and return the
 * re-serialized result. Used by package.json transform fixture tests.
 */
export async function runTransformOnPackageJson({
  filename = '/project/package.json',
  source,
  transform,
}: RunTransformOnPackageJsonArgs): Promise<string> {
  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single,
      useTrailingCommas: true,
    },
    useInMemoryFileSystem: true,
  })
  const data = JSON.parse(source) as Record<string, unknown>

  await runTransforms({
    packageJsons: [{ data, path: filename }],
    project,
    transforms: [transform],
  })

  return serializePackageJson(data, source)
}
