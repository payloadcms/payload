import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Project } from 'ts-morph'

import { deleteFiles, getDeletedFilePaths, loadProject } from './project.js'

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

describe('getDeletedFilePaths', () => {
  it('should return paths of snapshotted files that a transform deleted', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const kept = project.createSourceFile('/project/kept.ts', 'export const a = 1\n')
    const removed = project.createSourceFile('/project/removed.ts', 'export const b = 1\n')
    const snapshot = new Map(
      [kept, removed].map((file) => [file.getFilePath(), file.getFullText()] as const),
    )

    removed.delete()

    expect(getDeletedFilePaths({ project, snapshot })).toEqual(['/project/removed.ts'])
  })
})

describe('deleteFiles', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'codemod-delete-'))
  })

  afterEach(() => {
    rmSync(root, { force: true, recursive: true })
  })

  it('should delete the file and its directory when the directory is left empty', () => {
    mkdirSync(join(root, 'graphql'))
    writeFileSync(join(root, 'graphql/route.ts'), '')

    deleteFiles({ paths: [join(root, 'graphql/route.ts')] })

    expect(existsSync(join(root, 'graphql'))).toBe(false)
  })

  it('should keep the directory when other files remain', () => {
    mkdirSync(join(root, 'graphql'))
    writeFileSync(join(root, 'graphql/route.ts'), '')
    writeFileSync(join(root, 'graphql/helpers.ts'), '')

    deleteFiles({ paths: [join(root, 'graphql/route.ts')] })

    expect(existsSync(join(root, 'graphql/route.ts'))).toBe(false)
    expect(existsSync(join(root, 'graphql/helpers.ts'))).toBe(true)
  })
})
