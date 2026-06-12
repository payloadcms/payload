import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('typescript.postProcess', () => {
  it('should apply postProcess functions to generated types', async () => {
    const outputFile = path.resolve(dirname, 'payload-types.ts')
    const content = await fs.readFile(outputFile, 'utf-8')

    // Verify custom types were injected by postProcess
    expect(content).toContain('export type TestPluginGeneric<T> = { value: T };')
    expect(content).toContain('export type SecondGeneric<K, V> = { key: K; value: V };')
  })

  it('should apply multiple postProcess functions in order', async () => {
    const outputFile = path.resolve(dirname, 'payload-types.ts')
    const content = await fs.readFile(outputFile, 'utf-8')

    // SecondGeneric (from second function) should appear before TestPluginGeneric
    // because the second function prepends to TestPluginGeneric
    const secondIndex = content.indexOf('SecondGeneric')
    const firstIndex = content.indexOf('TestPluginGeneric')
    const configIndex = content.indexOf('export interface Config')

    expect(secondIndex).toBeGreaterThan(-1)
    expect(firstIndex).toBeGreaterThan(-1)
    expect(secondIndex).toBeLessThan(firstIndex)
    expect(firstIndex).toBeLessThan(configIndex)
  })
})
