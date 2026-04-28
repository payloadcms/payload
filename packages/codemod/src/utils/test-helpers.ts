import { Project } from 'ts-morph'

import type { Transform } from '../types.js'

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
  const project = new Project({ useInMemoryFileSystem: true })
  const file = project.createSourceFile(filename, source)

  await transform.apply({ project })

  return file.getFullText()
}
