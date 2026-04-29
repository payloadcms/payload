import { render, renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { ClientImportRegistryProvider, useClientImportRegistry } from './index.js'

describe('ClientImportRegistryProvider', () => {
  it('useClientImportRegistry throws when used outside the provider', () => {
    expect(() => renderHook(() => useClientImportRegistry())).toThrowError(
      /must be used within ClientImportRegistryProvider/,
    )
  })

  it('exposes the resolve API to descendants', async () => {
    const factories = {
      '@/v/handle': () => Promise.resolve({ default: () => true }),
    }
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClientImportRegistryProvider factories={factories}>{children}</ClientImportRegistryProvider>
    )
    const { result } = renderHook(() => useClientImportRegistry(), { wrapper })
    expect(result.current.has('@/v/handle')).toBe(true)
    const mod = await result.current.resolve('@/v/handle')
    expect(typeof (mod as { default?: unknown }).default).toBe('function')
  })

  it('returns null from resolve for unregistered paths', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClientImportRegistryProvider factories={{}}>{children}</ClientImportRegistryProvider>
    )
    const { result } = renderHook(() => useClientImportRegistry(), { wrapper })
    expect(await result.current.resolve('@/missing')).toBeNull()
  })

  it('keeps the registry instance stable across re-renders (lazy init)', () => {
    const instances: unknown[] = []
    function Probe() {
      instances.push(useClientImportRegistry())
      return null
    }
    const factories = { '@/x': () => Promise.resolve({ default: () => true }) }
    const { rerender } = render(
      <ClientImportRegistryProvider factories={factories}>
        <Probe />
      </ClientImportRegistryProvider>,
    )
    rerender(
      <ClientImportRegistryProvider factories={{ ...factories }}>
        <Probe />
      </ClientImportRegistryProvider>,
    )
    expect(instances[0]).toBe(instances[1])
  })
})
