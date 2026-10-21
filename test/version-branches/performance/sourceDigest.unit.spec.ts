import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'

import {
  getPerformanceSourceDigest,
  performanceSourceFiles,
  performanceSourceRoots,
} from './sourceDigest.mjs'

test('should pin new source and dependencies while excluding generated measurement evidence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'payload-branch-performance-source-'))

  try {
    for (const source of performanceSourceRoots) {
      await mkdir(join(root, source), { recursive: true })
      if (source.startsWith('packages/')) {
        await writeFile(join(root, source, '../package.json'), '{}')
      }
    }
    for (const file of performanceSourceFiles) {
      await writeFile(join(root, file), '{}')
    }
    const before = await getPerformanceSourceDigest({ root })
    const benchmark = join(root, 'test/version-branches/performance')

    await writeFile(join(benchmark, 'RESULTS.md'), 'Written with AI\nPending')
    await writeFile(join(benchmark, 'NATIVE-PLANS.md'), 'Written with AI\nNative plans')
    await mkdir(join(benchmark, 'final'))
    await writeFile(join(benchmark, 'final', 'report.json'), '{}')
    expect(await getPerformanceSourceDigest({ root })).toEqual(before)

    await writeFile(join(benchmark, 'tsconfig.json'), '{"compilerOptions": {"strict": true}}')
    const configuration = await getPerformanceSourceDigest({ root })
    expect(configuration.value).not.toBe(before.value)

    await writeFile(
      join(root, 'packages/payload/src/new-uncommitted-query.ts'),
      'export const value = 1',
    )
    const implementation = await getPerformanceSourceDigest({ root })

    expect(implementation.value).not.toBe(configuration.value)
    await writeFile(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 10')
    const dependencies = await getPerformanceSourceDigest({ root })
    expect(dependencies.value).not.toBe(implementation.value)
    await writeFile(join(root, 'test/dbAdapters.ts'), 'export const adapter = "changed"')
    expect((await getPerformanceSourceDigest({ root })).value).not.toBe(dependencies.value)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
