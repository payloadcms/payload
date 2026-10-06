import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  count: 0,
  handleConfirm: undefined as (() => void) | undefined,
  onBulkSelect: vi.fn() as ReturnType<typeof vi.fn> | undefined,
  selected: new Map<number | string, boolean>(),
}))

vi.mock('../../../providers/Selection/index.js', () => ({ useSelection: () => state }))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: () => 'Confirm' }),
}))
vi.mock('../../ListDrawer/Provider.js', () => ({ useListDrawerContext: () => state }))
vi.mock('../../Button/index.js', () => ({
  Button: (props: { children: React.ReactNode; disabled: boolean; onClick: () => void }) => {
    state.handleConfirm = props.onClick
    return React.createElement('button', { disabled: props.disabled }, props.children)
  },
}))

import { ListDrawerConfirmSelectionButton } from './ListDrawerConfirmSelectionButton.js'

describe('list drawer confirmation availability', () => {
  beforeEach(() => {
    state.count = 0
    state.onBulkSelect = vi.fn()
    state.selected = new Map()
  })

  it('should omit confirmation when row selection is disabled', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ListDrawerConfirmSelectionButton, { enableRowSelections: false }),
    )

    expect(markup).toBe('')
  })

  it('should omit confirmation without a bulk selection callback', () => {
    state.onBulkSelect = undefined

    const markup = renderToStaticMarkup(
      React.createElement(ListDrawerConfirmSelectionButton, { enableRowSelections: true }),
    )

    expect(markup).toBe('')
  })

  it('should disable confirmation until a document is selected', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ListDrawerConfirmSelectionButton, { enableRowSelections: true }),
    )

    expect(markup).toBe('<button disabled="">Confirm</button>')
  })

  it('should confirm the selected documents when row selection is enabled', () => {
    state.count = 1
    state.selected = new Map([
      [0, true],
      [1, false],
    ])

    const markup = renderToStaticMarkup(
      React.createElement(ListDrawerConfirmSelectionButton, { enableRowSelections: true }),
    )

    expect(markup).toBe('<button>Confirm</button>')
    state.handleConfirm?.()
    expect(state.onBulkSelect).toHaveBeenCalledWith(state.selected)
  })
})
