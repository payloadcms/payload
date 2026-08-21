import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { withPayload } from './withPayload.js'

describe('withPayload', () => {
  it('should set process.env.NEXT_BASE_PATH when nextConfig.basePath is provided', () => {
    const originalBasePath = process.env.NEXT_BASE_PATH
    delete process.env.NEXT_BASE_PATH

    try {
      const mockNextConfig = {
        basePath: '/test/basepath',
      }

      withPayload(mockNextConfig)

      // Verify it set the env var so formatAdminURL can read it
      expect(process.env.NEXT_BASE_PATH).toBe('/test/basepath')
    } finally {
      // Restore original value
      if (originalBasePath === undefined) {
        delete process.env.NEXT_BASE_PATH
      } else {
        process.env.NEXT_BASE_PATH = originalBasePath
      }
    }
  })

  it('should position devIndicators at the bottom left by default', () => {
    const result = withPayload({})

    expect(result.devIndicators).toEqual({ position: 'bottom-left' })
  })

  it('should use user-provided devIndicators when specified', () => {
    const result = withPayload({ devIndicators: { appIsrStatus: true } })

    expect(result.devIndicators).toEqual({ appIsrStatus: true })
  })

  it('should not modify process.env.NEXT_BASE_PATH when basePath is not provided', () => {
    const originalBasePath = process.env.NEXT_BASE_PATH

    try {
      const mockNextConfig = {}

      withPayload(mockNextConfig)

      // Verify it didn't set the env var
      expect(process.env.NEXT_BASE_PATH).toBe(originalBasePath)
    } finally {
      // Restore original value
      if (originalBasePath === undefined) {
        delete process.env.NEXT_BASE_PATH
      } else {
        process.env.NEXT_BASE_PATH = originalBasePath
      }
    }
  })
})

describe('withPayload > outputFileTracingIncludes', () => {
  const fixtureDirs: string[] = []

  afterEach(async () => {
    for (const dir of fixtureDirs) {
      await fs.rm(dir, { force: true, recursive: true })
    }

    fixtureDirs.length = 0
  })

  /**
   * Next.js treats every value of `outputFileTracingIncludes` as a glob pattern resolved from the
   * Next.js project root - not as a package specifier. It globs each one with
   * `{ cwd: <projectRoot>, nodir: true }` in `collect-build-traces`, so a bare package name such as
   * `@libsql/client` silently matches nothing and the include never ships any file.
   */
  const matchFromProjectRoot = async ({
    projectRoot,
    patterns,
  }: {
    patterns: string[]
    projectRoot: string
  }): Promise<string[]> => {
    const matched: string[] = []

    for (const pattern of patterns) {
      for await (const entry of fs.glob(pattern, { cwd: projectRoot })) {
        matched.push(entry as string)
      }
    }

    return matched
  }

  const createProjectRoot = async ({ packagePath }: { packagePath: string }): Promise<string> => {
    const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'with-payload-tracing-'))

    fixtureDirs.push(projectRoot)

    await fs.mkdir(path.join(projectRoot, packagePath), { recursive: true })
    await fs.writeFile(path.join(projectRoot, packagePath, 'index.js'), 'module.exports = {}')

    return projectRoot
  }

  const getIncludes = (): string[] => withPayload({}).outputFileTracingIncludes['**/*']

  it('should resolve @libsql/client from a hoisted node_modules layout', async () => {
    const projectRoot = await createProjectRoot({ packagePath: 'node_modules/@libsql/client' })

    const matched = await matchFromProjectRoot({ projectRoot, patterns: getIncludes() })

    expect(matched).toContain(path.join('node_modules', '@libsql', 'client', 'index.js'))
  })

  it('should resolve @libsql/client from a pnpm store layout', async () => {
    const packagePath =
      'node_modules/.pnpm/@libsql+client@0.14.0_bufferutil@4.1.0/node_modules/@libsql/client'

    const projectRoot = await createProjectRoot({ packagePath })

    const matched = await matchFromProjectRoot({ projectRoot, patterns: getIncludes() })

    expect(matched).toContain(path.join(packagePath, 'index.js'))
  })

  /**
   * Guards the shape rather than the single entry: a bare specifier is indistinguishable from a
   * working include at config time, and only shows up as a missing file at runtime in production.
   */
  it('should not ship bare package specifiers as tracing includes', () => {
    const bareSpecifiers = getIncludes().filter((include) => !include.includes('*'))

    expect(bareSpecifiers).toEqual([])
  })

  it('should preserve user-provided tracing includes', () => {
    const result = withPayload({
      outputFileTracingIncludes: { '**/*': ['my-folder/**/*'] },
    })

    expect(result.outputFileTracingIncludes['**/*']).toContain('my-folder/**/*')
  })
})
