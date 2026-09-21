// @vitest-environment jsdom

import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { renderFieldsMock } = vi.hoisted(() => ({
  renderFieldsMock: vi.fn(() => React.createElement('div', { 'data-testid': 'render-fields' })),
}))

vi.mock('../../elements/ArrayAction/index.js', () => ({
  ArrayAction: () => null,
}))

vi.mock('../../elements/Collapsible/index.js', () => ({
  Collapsible: ({
    children,
  }: {
    children: React.ReactNode
  }) => React.createElement('div', null, children),
}))

vi.mock('../../elements/ErrorPill/index.js', () => ({
  ErrorPill: () => null,
}))

vi.mock('../../elements/ShimmerEffect/index.js', () => ({
  ShimmerEffect: () => React.createElement('div', { 'data-testid': 'shimmer' }),
}))

vi.mock('../../forms/Form/context.js', () => ({
  useFormSubmitted: () => false,
}))

vi.mock('../../forms/RenderFields/index.js', () => ({
  RenderFields: renderFieldsMock,
}))

vi.mock('../../forms/RowLabel/index.js', () => ({
  RowLabel: () => React.createElement('div', { 'data-testid': 'row-label' }),
}))

vi.mock('../../hooks/useThrottledValue.js', () => ({
  useThrottledValue: (value: unknown) => value,
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
    },
  }),
}))

import { ArrayRow } from './ArrayRow.js'

const cleanups: Array<() => void> = []

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup()
  }

  renderFieldsMock.mockClear()
})

describe('ArrayRow', () => {
  it('does not mount RenderFields when the row is collapsed', () => {
    const { container } = renderArrayRow({
      collapsed: true,
    })

    expect(container.querySelector('[data-testid="render-fields"]')).toBeNull()
    expect(renderFieldsMock).not.toHaveBeenCalled()
  })

  it('mounts RenderFields when the row is expanded', () => {
    const { container } = renderArrayRow({
      collapsed: false,
    })

    expect(container.querySelector('[data-testid="render-fields"]')).not.toBeNull()
    expect(renderFieldsMock).toHaveBeenCalledOnce()
  })
})

function renderArrayRow({ collapsed }: { collapsed: boolean }): {
  container: HTMLElement
} {
  const container = document.createElement('div')
  const root: Root = createRoot(container)

  act(() => {
    root.render(
      React.createElement(ArrayRow, {
        addRow: vi.fn(),
        copyRow: vi.fn(),
        duplicateRow: vi.fn(),
        errorCount: 0,
        fields: [],
        hasMaxRows: false,
        isDragging: false,
        isLoading: false,
        isSortable: false,
        labels: {
          plural: 'Rows',
          singular: 'Row',
        },
        moveRow: vi.fn(),
        parentPath: 'array',
        pasteRow: vi.fn(),
        pasteRowBelow: vi.fn(),
        path: 'array.0',
        permissions: true,
        readOnly: false,
        removeRow: vi.fn(),
        row: {
          id: 'row-1',
          collapsed,
        },
        rowCount: 1,
        rowIndex: 0,
        schemaPath: 'array',
        scrollIdPrefix: 'array',
        setCollapse: vi.fn(),
        setNodeRef: vi.fn(),
        transform: undefined,
        transition: undefined,
      }),
    )
  })

  cleanups.push(() => {
    act(() => {
      root.unmount()
    })
  })

  return { container }
}
