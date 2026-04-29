import { renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { useVisibility, useVisibilityMap, VisibilityMapProvider } from './index.js'

describe('VisibilityMapProvider', () => {
  it('useVisibilityMap throws when used outside the provider', () => {
    expect(() => renderHook(() => useVisibilityMap())).toThrowError(
      /must be used within VisibilityMapProvider/,
    )
  })

  it('useVisibility returns true outside the provider (default visible)', () => {
    const { result } = renderHook(() => useVisibility('posts.title'))
    expect(result.current).toBe(true)
  })

  it('useVisibilityMap exposes the provided map', () => {
    const map = new Map<string, boolean>([
      ['posts.title', true],
      ['posts.subtitle', false],
    ])
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VisibilityMapProvider map={map}>{children}</VisibilityMapProvider>
    )
    const { result } = renderHook(() => useVisibilityMap(), { wrapper })
    expect(result.current).toBe(map)
  })

  it('useVisibility returns the visibility for a given path', () => {
    const map = new Map<string, boolean>([
      ['posts.title', true],
      ['posts.subtitle', false],
    ])
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VisibilityMapProvider map={map}>{children}</VisibilityMapProvider>
    )
    const { result: visibleResult } = renderHook(() => useVisibility('posts.title'), { wrapper })
    expect(visibleResult.current).toBe(true)
    const { result: hiddenResult } = renderHook(() => useVisibility('posts.subtitle'), { wrapper })
    expect(hiddenResult.current).toBe(false)
  })

  it('useVisibility returns true when path is not in the map', () => {
    const map = new Map<string, boolean>()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VisibilityMapProvider map={map}>{children}</VisibilityMapProvider>
    )
    const { result } = renderHook(() => useVisibility('posts.unknown'), { wrapper })
    expect(result.current).toBe(true)
  })
})
