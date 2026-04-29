import { renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import {
  AdminValidateErrorsProvider,
  useAdminValidateError,
  useAdminValidateErrors,
} from './index.js'

describe('AdminValidateErrorsProvider', () => {
  it('useAdminValidateErrors throws when used outside the provider', () => {
    expect(() => renderHook(() => useAdminValidateErrors())).toThrowError(
      /must be used within AdminValidateErrorsProvider/,
    )
  })

  it('useAdminValidateError returns undefined outside the provider (graceful fallback)', () => {
    const { result } = renderHook(() => useAdminValidateError('posts.handle'))
    expect(result.current).toBeUndefined()
  })

  it('useAdminValidateErrors exposes the provided map', () => {
    const errors = new Map<string, string>([
      ['posts.handle', 'too short'],
      ['posts.slug', 'invalid format'],
    ])
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminValidateErrorsProvider errors={errors}>{children}</AdminValidateErrorsProvider>
    )
    const { result } = renderHook(() => useAdminValidateErrors(), { wrapper })
    expect(result.current).toBe(errors)
  })

  it('useAdminValidateError returns the error message for a given path', () => {
    const errors = new Map<string, string>([
      ['posts.handle', 'too short'],
      ['posts.slug', 'invalid format'],
    ])
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminValidateErrorsProvider errors={errors}>{children}</AdminValidateErrorsProvider>
    )
    const { result: handleResult } = renderHook(() => useAdminValidateError('posts.handle'), {
      wrapper,
    })
    expect(handleResult.current).toBe('too short')
    const { result: slugResult } = renderHook(() => useAdminValidateError('posts.slug'), {
      wrapper,
    })
    expect(slugResult.current).toBe('invalid format')
  })

  it('useAdminValidateError returns undefined when path is not in the map', () => {
    const errors = new Map<string, string>()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminValidateErrorsProvider errors={errors}>{children}</AdminValidateErrorsProvider>
    )
    const { result } = renderHook(() => useAdminValidateError('posts.unknown'), { wrapper })
    expect(result.current).toBeUndefined()
  })
})
