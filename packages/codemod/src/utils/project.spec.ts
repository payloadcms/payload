import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadProject } from './project.js'

describe('loadProject', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'codemod-project-'))
    mkdirSync(join(root, 'src'))
    writeFileSync(join(root, 'src/index.ts'), 'export const a = 1\n')
  })

  afterEach(() => {
    rmSync(root, { force: true, recursive: true })
    vi.restoreAllMocks()
  })

  it('resolves ${configDir} in an extended tsconfig', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mkdirSync(join(root, 'pkg/src'), { recursive: true })
    writeFileSync(join(root, 'pkg/src/index.ts'), 'export const b = 1\n')
    writeFileSync(
      join(root, 'tsconfig.base.json'),
      JSON.stringify({ include: ['${configDir}/src'] }),
    )
    writeFileSync(
      join(root, 'pkg/tsconfig.json'),
      JSON.stringify({ extends: '../tsconfig.base.json' }),
    )

    const files = loadProject(join(root, 'pkg'))
      .getSourceFiles()
      .map((file) => file.getFilePath())

    expect(files).toEqual([expect.stringMatching(/pkg\/src\/index\.ts$/)])
    expect(warn).not.toHaveBeenCalled()
  })

  it('falls back to globbing when the tsconfig resolves no source files', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    writeFileSync(
      join(root, 'tsconfig.json'),
      JSON.stringify({ files: [], references: [{ path: './src' }] }),
    )

    const files = loadProject(root)
      .getSourceFiles()
      .map((file) => file.getFilePath())

    expect(files).toEqual([expect.stringMatching(/src\/index\.ts$/)])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('resolved no source files'))
  })
})
