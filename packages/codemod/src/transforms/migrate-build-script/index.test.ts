import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runTransformOnPackageJson } from '../../utils/test-helpers.js'
import { migrateBuildScript } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-build-script', () => {
  it('rewrites a plain next build script', async () => {
    const input = await fixture('basic.input.json')
    const output = await fixture('basic.output.json')

    const result = await runTransformOnPackageJson({ source: input, transform: migrateBuildScript })

    expect(result).toBe(output)
  })

  it('rewrites a cross-env-prefixed build script', async () => {
    const input = await fixture('cross-env.input.json')
    const output = await fixture('cross-env.output.json')

    const result = await runTransformOnPackageJson({ source: input, transform: migrateBuildScript })

    expect(result).toBe(output)
  })

  it('rewrites only the next build segment of a compound build script', async () => {
    const input = await fixture('tsc-suffix.input.json')
    const output = await fixture('tsc-suffix.output.json')

    const result = await runTransformOnPackageJson({ source: input, transform: migrateBuildScript })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.json')

    const result = await runTransformOnPackageJson({
      source: output,
      transform: migrateBuildScript,
    })

    expect(result).toBe(output)
  })

  it('no-ops on next build-storybook and unrelated scripts', async () => {
    const input = await fixture('no-match.input.json')
    const output = await fixture('no-match.output.json')

    const result = await runTransformOnPackageJson({ source: input, transform: migrateBuildScript })

    expect(result).toBe(output)
  })

  it('no-ops when there is no build script', async () => {
    const input = '{\n  "scripts": {\n    "dev": "next dev"\n  }\n}\n'

    const result = await runTransformOnPackageJson({ source: input, transform: migrateBuildScript })

    expect(result).toBe(input)
  })
})
