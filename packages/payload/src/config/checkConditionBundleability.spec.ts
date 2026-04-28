import path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

import { checkConditionBundleability } from './checkConditionBundleability.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('checkConditionBundleability', () => {
  it('passes for a condition with no server-only imports', async () => {
    const fixture = path.join(__dirname, '__fixtures__', 'condition-pure.ts')
    await expect(checkConditionBundleability({ entryPoint: fixture })).resolves.toEqual({
      ok: true,
    })
  })

  it('fails for a condition that imports a server-only module', async () => {
    const fixture = path.join(__dirname, '__fixtures__', 'condition-fs.ts')
    const result = await checkConditionBundleability({ entryPoint: fixture })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reasons.some((r) => /node:fs|^fs$|node:|fs/.test(r))).toBe(true)
    }
  })

  it('returns ok: false with a clear reason for a missing entry point', async () => {
    const result = await checkConditionBundleability({ entryPoint: '/path/does/not/exist.ts' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reasons).toHaveLength(1)
      expect(result.reasons[0]).toMatch(/not exist|could not resolve|enoent/i)
    }
  })
})
