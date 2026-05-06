import { IndentationText, Project } from 'ts-morph'

import type { Transform } from '../types.js'

import { runTransforms } from '../runner.js'

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
    manipulationSettings: { indentationText: IndentationText.TwoSpaces },
    useInMemoryFileSystem: true,
  })
  const file = project.createSourceFile(filename, source)

  await runTransforms({ project, transforms: [transform] })

  return file.getFullText()
}
