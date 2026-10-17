// @vitest-environment jsdom

import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FormContext, FormWatchContext } from '../../Form/context.js'
import { RowLabelProvider, useRowLabel } from './index.js'

const Consumer = () => {
  const { data } = useRowLabel<{ label: string }>()
  return React.createElement('div', { 'data-testid': 'label-data' }, data.label)
}

const cleanups: Array<() => void> = []

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup()
  }
})

describe('RowLabelProvider', () => {
  it('reads row data from FormContext instead of FormWatchContext', () => {
    const container = document.createElement('div')
    const root: Root = createRoot(container)

    const formContext = {
      getDataByPath: vi.fn(() => ({ label: 'from-form' })),
      getSiblingData: vi.fn(() => ({ label: 'from-form-sibling' })),
    }

    const watchContext = {
      getDataByPath: vi.fn(() => ({ label: 'from-watch' })),
      getSiblingData: vi.fn(() => ({ label: 'from-watch-sibling' })),
    }

    act(() => {
      root.render(
        React.createElement(
          FormContext.Provider,
          { value: formContext },
          React.createElement(
            FormWatchContext.Provider,
            { value: watchContext },
            React.createElement(
              RowLabelProvider,
              { path: 'array.0', rowNumber: 0 },
              React.createElement(Consumer),
            ),
          ),
        ),
      )
    })

    expect(container.querySelector('[data-testid="label-data"]')?.textContent).toBe('from-form')
    expect(formContext.getDataByPath).toHaveBeenCalledWith('array.0')
    expect(watchContext.getDataByPath).not.toHaveBeenCalled()

    cleanups.push(() => {
      act(() => {
        root.unmount()
      })
    })
  })
})