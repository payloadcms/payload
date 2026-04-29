import type { FormState } from 'payload'

import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { VisibilityMapProvider } from '../../providers/VisibilityMap/index.js'
import { FormFieldsContext } from '../Form/context.js'
import { WatchCondition } from './WatchCondition.js'

const PATH = 'posts.advancedNote'
const CHILD_TEXT = 'visible-child'
const child = <span data-testid="child">{CHILD_TEXT}</span>

function FormFieldsWrapper({ children, fields }: { children: React.ReactNode; fields: FormState }) {
  // FormFieldsContext is a use-context-selector context; its Provider expects
  // a `[fields, dispatch]` tuple to mirror the production reducer shape.
  return (
    // eslint-disable-next-line @eslint-react/no-context-provider
    <FormFieldsContext.Provider value={[fields, () => null]}>{children}</FormFieldsContext.Provider>
  )
}

describe('WatchCondition', () => {
  // Vitest project does not enable globals/auto-cleanup, so unmount manually
  // between cases to keep the global jsdom document free of stale nodes.
  afterEach(() => {
    cleanup()
  })

  it('renders children when no VisibilityMap and no formState entry exists', () => {
    const { container } = render(
      <FormFieldsWrapper fields={{}}>
        <WatchCondition path={PATH}>{child}</WatchCondition>
      </FormFieldsWrapper>,
    )
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe(CHILD_TEXT)
  })

  it('renders null when no VisibilityMap and formState passesCondition is false', () => {
    const { container } = render(
      <FormFieldsWrapper fields={{ [PATH]: { passesCondition: false } }}>
        <WatchCondition path={PATH}>{child}</WatchCondition>
      </FormFieldsWrapper>,
    )
    expect(container.querySelector('[data-testid="child"]')).toBeNull()
    expect(container.innerHTML).toBe('')
  })

  it('renders children when no VisibilityMap and formState passesCondition is true', () => {
    const { container } = render(
      <FormFieldsWrapper fields={{ [PATH]: { passesCondition: true } }}>
        <WatchCondition path={PATH}>{child}</WatchCondition>
      </FormFieldsWrapper>,
    )
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe(CHILD_TEXT)
  })

  it('renders children when VisibilityMap entry is true (overrides formState)', () => {
    const map = new Map<string, boolean>([[PATH, true]])
    const { container } = render(
      <FormFieldsWrapper fields={{ [PATH]: { passesCondition: false } }}>
        <VisibilityMapProvider map={map}>
          <WatchCondition path={PATH}>{child}</WatchCondition>
        </VisibilityMapProvider>
      </FormFieldsWrapper>,
    )
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe(CHILD_TEXT)
  })

  it('renders null when VisibilityMap entry is false (overrides formState)', () => {
    const map = new Map<string, boolean>([[PATH, false]])
    const { container } = render(
      <FormFieldsWrapper fields={{ [PATH]: { passesCondition: true } }}>
        <VisibilityMapProvider map={map}>
          <WatchCondition path={PATH}>{child}</WatchCondition>
        </VisibilityMapProvider>
      </FormFieldsWrapper>,
    )
    expect(container.querySelector('[data-testid="child"]')).toBeNull()
    expect(container.innerHTML).toBe('')
  })

  it('falls back to formState passesCondition when VisibilityMap has no entry for the path', () => {
    const map = new Map<string, boolean>([['some.other.path', true]])
    const { container } = render(
      <FormFieldsWrapper fields={{ [PATH]: { passesCondition: false } }}>
        <VisibilityMapProvider map={map}>
          <WatchCondition path={PATH}>{child}</WatchCondition>
        </VisibilityMapProvider>
      </FormFieldsWrapper>,
    )
    expect(container.querySelector('[data-testid="child"]')).toBeNull()
    expect(container.innerHTML).toBe('')
  })
})
