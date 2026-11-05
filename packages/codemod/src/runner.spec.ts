import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import type { Transform } from './types.js'

import { runTransforms } from './runner.js'

function makeProject(files: Record<string, string>): Project {
  const project = new Project({ useInMemoryFileSystem: true })
  for (const [path, contents] of Object.entries(files)) {
    project.createSourceFile(path, contents)
  }
  return project
}

describe('runTransforms', () => {
  it('applies each transform in order and aggregates results', async () => {
    const project = makeProject({ 'a.ts': 'export const a = 1' })

    const t1: Transform = {
      name: 't1',
      apply: () => ({ filesChanged: ['a.ts'] }),
      description: '',
    }
    const t2: Transform = {
      name: 't2',
      apply: () => ({ filesChanged: [], notes: ['nothing to do'] }),
      description: '',
    }

    const result = await runTransforms({
      project,
      transforms: [t1, t2],
    })

    expect(result.results.map((r) => r.name)).toEqual(['t1', 't2'])
    expect(result.results[0]!.filesChanged).toEqual(['a.ts'])
    expect(result.failed).toBe(false)
  })

  it('continues past a throwing transform and marks the run failed', async () => {
    const project = makeProject({ 'a.ts': 'export const a = 1' })

    const boom: Transform = {
      name: 'boom',
      apply: () => {
        throw new Error('kaboom')
      },
      description: '',
    }
    const ok: Transform = {
      name: 'ok',
      apply: () => ({ filesChanged: [] }),
      description: '',
    }

    const result = await runTransforms({
      project,
      transforms: [boom, ok],
    })

    expect(result.failed).toBe(true)
    expect(result.results.map((r) => r.name)).toEqual(['boom', 'ok'])
    expect(result.results[0]!.error).toBeInstanceOf(Error)
    expect(result.results[1]!.error).toBeUndefined()
  })
})
