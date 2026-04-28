import { describe, expect, it } from 'vitest'

import { createClientImportRegistry } from './clientImportRegistry.js'

describe('clientImportRegistry', () => {
  it('resolves a registered path to its module factory', async () => {
    const registry = createClientImportRegistry({
      '@/v/handle': () => Promise.resolve({ default: (v: string) => (v ? true : 'required') }),
    })
    const mod = await registry.resolve('@/v/handle')
    expect(typeof (mod as { default?: unknown })?.default).toBe('function')
  })

  it('returns null for an unregistered path', async () => {
    const registry = createClientImportRegistry({})
    expect(await registry.resolve('@/missing')).toBeNull()
  })

  it('memoizes resolutions so the factory runs at most once per path', async () => {
    let calls = 0
    const registry = createClientImportRegistry({
      '@/x': () => {
        calls++
        return Promise.resolve({ default: () => true })
      },
    })
    await registry.resolve('@/x')
    await registry.resolve('@/x')
    expect(calls).toBe(1)
  })
})
