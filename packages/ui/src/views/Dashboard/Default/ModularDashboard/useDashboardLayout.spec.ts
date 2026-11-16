// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import type { WidgetInstanceClient } from './index.client.js'

import { useDashboardLayout } from './useDashboardLayout.js'

const { openModal, setPreference } = vi.hoisted(() => ({
  openModal: vi.fn(),
  setPreference: vi.fn(),
}))

vi.mock('payload/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('payload/shared')>()),
  PREFERENCE_KEYS: { DASHBOARD_LAYOUT: 'dashboard-layout' },
}))
vi.mock('../../../../elements/ConfirmationModal/index.js', () => ({
  ConfirmationModal: () => null,
}))
vi.mock('../../../../elements/Modal/index.js', () => ({ useModal: () => ({ openModal }) }))
vi.mock('../../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      admin: {
        dashboard: {
          widgets: [
            { slug: 'collection-query' },
            {
              slug: 'replacement',
              minWidth: 'small',
              maxWidth: 'large',
              preview: { data: { timeframe: 'weekly', title: 'Preview only' } },
              controls: [
                {
                  name: 'timeframe',
                  type: 'select',
                  defaultValue: 'monthly',
                  options: ['monthly', 'weekly'],
                },
              ],
            },
          ],
        },
      },
    },
  }),
}))
vi.mock('../../../../providers/Embed/index.js', () => ({ useEmbed: () => ({ isEmbedded: false }) }))
vi.mock('../../../../providers/Preferences/index.js', () => ({
  usePreferences: () => ({ setPreference }),
}))
vi.mock('../../../../providers/ServerFunctions/index.js', () => ({
  useServerFunctions: () => ({ serverFunction: vi.fn() }),
}))
vi.mock('../../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('./renderWidget/RenderWidget.js', () => ({ RenderWidget: () => null }))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('should cancel without confirmation when a saved layout is reopened without changes', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  openModal.mockClear()
  const root = createRoot(document.createElement('div'))
  const initialLayout: WidgetInstanceClient[] = [
    { component: null, item: { id: 'a', width: 'x-small', minWidth: 'x-small', maxWidth: 'full' } },
  ]
  let dashboard!: ReturnType<typeof useDashboardLayout>
  const Harness = () => {
    dashboard = useDashboardLayout(initialLayout)
    return null
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    act(() => dashboard.setIsEditing(true))
    act(() => dashboard.cancel())
    expect(dashboard.isEditing).toBe(false)
    expect(openModal).not.toHaveBeenCalled()

    act(() => dashboard.setIsEditing(true))
    act(() => dashboard.resizeWidget({ widgetID: 'a', width: 'medium' }))
    await act(async () => dashboard.saveLayout())
    act(() => dashboard.setIsEditing(true))
    act(() => dashboard.cancel())

    expect(openModal).not.toHaveBeenCalled()
    expect(dashboard.isEditing).toBe(false)
    expect(dashboard.currentLayout[0].item.width).toBe('medium')

    act(() => dashboard.setIsEditing(true))
    act(() => dashboard.resizeWidget({ widgetID: 'a', width: 'large' }))
    act(() => dashboard.cancel())
    expect(openModal).toHaveBeenCalledWith('cancel-dashboard-changes')
    act(() => dashboard.cancelModal.props.onConfirm())
    expect(dashboard.currentLayout[0].item.width).toBe('medium')
  } finally {
    act(() => root.unmount())
  }
})

it('should cancel without confirmation when edits restore the original rows, widths and widget data', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  openModal.mockClear()
  const root = createRoot(document.createElement('div'))
  const initialLayout: WidgetInstanceClient[] = [
    { component: null, item: { id: 'a', width: 'full', minWidth: 'x-small', maxWidth: 'full' } },
    {
      component: null,
      item: {
        id: 'b',
        width: 'x-small',
        minWidth: 'x-small',
        maxWidth: 'full',
        data: { title: 'My widget', count: 10 },
      },
    },
  ]
  let dashboard!: ReturnType<typeof useDashboardLayout>
  const Harness = () => {
    dashboard = useDashboardLayout(initialLayout)
    return null
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    act(() => dashboard.setIsEditing(true))
    act(() => dashboard.resizeWidget({ widgetID: 'b', width: 'medium' }))
    act(() => dashboard.resizeWidget({ widgetID: 'b', width: 'x-small' }))
    act(() => dashboard.updateWidgetData('b', { count: 10, title: 'My widget' }))
    act(() => dashboard.cancel())

    expect(openModal).not.toHaveBeenCalled()
    expect(dashboard.isEditing).toBe(false)
  } finally {
    act(() => root.unmount())
  }
})

it('should distinguish widgets added in the same millisecond when moving and deleting them', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  const container = document.createElement('div')
  const root = createRoot(container)
  const initialLayout: WidgetInstanceClient[] = []
  let dashboard!: ReturnType<typeof useDashboardLayout>

  const Harness = () => {
    dashboard = useDashboardLayout(initialLayout)
    return null
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    act(() => dashboard.setIsEditing(true))
    act(() => {
      dashboard.addWidget({ widgetSlug: 'collection-query' })
      dashboard.addWidget({ widgetSlug: 'collection-query' })
    })
    const ids = dashboard.currentLayout.map(({ item }) => item.id)

    expect(new Set(ids).size).toBe(2)
    for (const id of ids) {
      expect(id).toMatch(/^collection-query-[^-]+$/)
    }

    act(() => dashboard.moveWidget({ moveFromIndex: 0, moveToIndex: 1 }))
    expect(dashboard.currentLayout.map(({ item }) => item.id)).toEqual([ids[1], ids[0]])
    act(() => dashboard.deleteWidget(ids[0]))
    expect(dashboard.currentLayout.map(({ item }) => item.id)).toEqual([ids[1]])
  } finally {
    act(() => root.unmount())
  }
})

it.each([
  { expectedWidth: 'small', width: 'x-small' },
  { expectedWidth: 'medium', width: 'medium' },
  { expectedWidth: 'large', width: 'full' },
] as const)(
  'should replace a widget in place with width $width constrained to $expectedWidth',
  ({ expectedWidth, width }) => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.useFakeTimers()
    const container = document.createElement('div')
    const root = createRoot(container)
    const initialLayout: WidgetInstanceClient[] = [
      {
        component: null,
        item: { id: 'first-1', width: 'full', minWidth: 'x-small', maxWidth: 'full' },
      },
      {
        component: null,
        item: {
          id: 'original-2',
          data: { title: 'Old settings' },
          width,
          minWidth: 'x-small',
          maxWidth: 'full',
        },
      },
      {
        component: null,
        item: { id: 'last-3', width: 'full', minWidth: 'x-small', maxWidth: 'full' },
      },
    ]
    let dashboard!: ReturnType<typeof useDashboardLayout>

    const Harness = () => {
      dashboard = useDashboardLayout(initialLayout)
      return null
    }

    try {
      act(() => root.render(React.createElement(Harness)))
      act(() => dashboard.setIsEditing(true))
      let replacementID: string | undefined

      act(() => {
        replacementID = dashboard.replaceWidget({
          widgetID: 'original-2',
          widgetSlug: 'replacement',
        })
      })

      expect(replacementID).toMatch(/^replacement-[^-]+$/)
      expect(dashboard.currentLayout).toHaveLength(3)
      expect(dashboard.currentLayout[0]).toBe(initialLayout[0])
      expect(dashboard.currentLayout[2]).toBe(initialLayout[2])
      expect(dashboard.currentLayout[1].item).toEqual({
        id: replacementID,
        data: { timeframe: 'monthly' },
        maxWidth: 'large',
        minWidth: 'small',
        width: expectedWidth,
      })
    } finally {
      act(() => root.unmount())
    }
  },
)

it('should ignore replacement outside edit mode or with an unknown widget', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  const initialLayout: WidgetInstanceClient[] = [
    {
      component: null,
      item: { id: 'original-1', width: 'full', minWidth: 'x-small', maxWidth: 'full' },
    },
  ]
  let dashboard!: ReturnType<typeof useDashboardLayout>

  const Harness = () => {
    dashboard = useDashboardLayout(initialLayout)
    return null
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    act(() => {
      dashboard.replaceWidget({ widgetID: 'original-1', widgetSlug: 'replacement' })
    })
    expect(dashboard.currentLayout).toEqual(initialLayout)
    act(() => dashboard.setIsEditing(true))
    act(() => {
      dashboard.replaceWidget({ widgetID: 'original-1', widgetSlug: 'unknown' })
      dashboard.replaceWidget({ widgetID: 'missing', widgetSlug: 'replacement' })
    })
    expect(dashboard.currentLayout).toEqual(initialLayout)
  } finally {
    act(() => root.unmount())
  }
})

it('should move and resize together, including when the insertion index is unchanged', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const root = createRoot(document.createElement('div'))
  const initialLayout: WidgetInstanceClient[] = [
    {
      component: null,
      item: { id: 'active', width: 'full', minWidth: 'x-small', maxWidth: 'full' },
    },
    {
      component: null,
      item: { id: 'target', width: 'large', minWidth: 'x-small', maxWidth: 'full' },
    },
  ]
  let dashboard!: ReturnType<typeof useDashboardLayout>
  const Harness = () => {
    dashboard = useDashboardLayout(initialLayout)
    return null
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    act(() => dashboard.setIsEditing(true))
    act(() => dashboard.moveWidget({ moveFromIndex: 0, moveToIndex: 0, width: 'small' }))
    expect(dashboard.currentLayout[0].item.width).toBe('small')
    act(() => dashboard.moveWidget({ moveFromIndex: 0, moveToIndex: 1, width: 'medium' }))
    expect(dashboard.currentLayout.map(({ item }) => [item.id, item.width])).toEqual([
      ['target', 'large'],
      ['active', 'medium'],
    ])
    expect(initialLayout[0].item.width).toBe('full')
  } finally {
    act(() => root.unmount())
  }
})

it('should preview resizing from the original row and restore all siblings on cancel', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const root = createRoot(document.createElement('div'))
  const initialLayout: WidgetInstanceClient[] = [
    {
      component: null,
      item: { id: 'sibling', width: 'medium', minWidth: 'x-small', maxWidth: 'full' },
    },
    {
      component: null,
      item: { id: 'active', width: 'medium', minWidth: 'x-small', maxWidth: 'full' },
    },
  ]
  let dashboard!: ReturnType<typeof useDashboardLayout>
  const Harness = () => {
    dashboard = useDashboardLayout(initialLayout)
    return null
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    act(() => dashboard.setIsEditing(true))
    act(() => dashboard.startWidgetResize('active'))
    act(() => dashboard.resizeWidget({ widgetID: 'active', width: 'full' }))
    expect(dashboard.currentLayout.map(({ item }) => item.id)).toEqual(['active', 'sibling'])
    act(() => dashboard.resizeWidget({ widgetID: 'active', width: 'large' }))
    expect(dashboard.currentLayout.map(({ item }) => [item.id, item.width])).toEqual([
      ['sibling', 'small'],
      ['active', 'large'],
    ])
    act(() => dashboard.resizeWidget({ widgetID: 'active', width: 'medium' }))
    expect(dashboard.currentLayout).toEqual(initialLayout)
    act(() => dashboard.resizeWidget({ widgetID: 'active', width: 'x-large' }))
    act(() => dashboard.finishWidgetResize({ shouldCancel: true }))
    expect(dashboard.currentLayout).toEqual(initialLayout)

    act(() => dashboard.startWidgetResize('active'))
    act(() => {
      dashboard.resizeWidget({ widgetID: 'active', width: 'large' })
      dashboard.finishWidgetResize({ shouldCancel: false })
    })
    expect(dashboard.currentLayout.map(({ item }) => item.width)).toEqual(['small', 'large'])
    act(() => dashboard.startWidgetResize('active'))
    act(() => dashboard.resizeWidget({ edge: 'start', widgetID: 'active', width: 'medium' }))
    expect(dashboard.currentLayout.map(({ item }) => item.width)).toEqual(['medium', 'medium'])
    act(() => dashboard.finishWidgetResize({ shouldCancel: true }))
    expect(dashboard.currentLayout.map(({ item }) => item.width)).toEqual(['small', 'large'])
  } finally {
    act(() => root.unmount())
  }
})

it('should insert a dropped widget at its target index with defaults and bounded width', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  const root = createRoot(document.createElement('div'))
  const initialLayout: WidgetInstanceClient[] = [
    {
      component: null,
      item: { id: 'first', width: 'full', minWidth: 'x-small', maxWidth: 'full' },
    },
    { component: null, item: { id: 'last', width: 'full', minWidth: 'x-small', maxWidth: 'full' } },
  ]
  let dashboard!: ReturnType<typeof useDashboardLayout>
  const Harness = () => {
    dashboard = useDashboardLayout(initialLayout)
    return null
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    act(() => dashboard.setIsEditing(true))
    act(() => dashboard.addWidget({ widgetSlug: 'replacement', index: 1, width: 'full' }))
    expect(dashboard.currentLayout[0]).toBe(initialLayout[0])
    expect(dashboard.currentLayout[2]).toBe(initialLayout[1])
    expect(dashboard.currentLayout[1].item).toMatchObject({
      data: { timeframe: 'monthly' },
      width: 'large',
      minWidth: 'small',
      maxWidth: 'large',
    })
    act(() => dashboard.addWidget({ widgetSlug: 'missing', index: 0 }))
    expect(dashboard.currentLayout).toHaveLength(3)
  } finally {
    act(() => root.unmount())
  }
})

it.each([0, 1])(
  'should move into index %s and resize a full-width target in the same update',
  (moveToIndex) => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const root = createRoot(document.createElement('div'))
    const initialLayout: WidgetInstanceClient[] = [
      {
        component: null,
        item: { id: 'target', width: 'full', minWidth: 'x-small', maxWidth: 'full' },
      },
      {
        component: null,
        item: { id: 'active', width: 'x-small', minWidth: 'x-small', maxWidth: 'full' },
      },
    ]
    let dashboard!: ReturnType<typeof useDashboardLayout>
    const Harness = () => {
      dashboard = useDashboardLayout(initialLayout)
      return null
    }

    try {
      act(() => root.render(React.createElement(Harness)))
      act(() => dashboard.setIsEditing(true))
      act(() =>
        dashboard.moveWidget({
          moveFromIndex: 1,
          moveToIndex,
          width: 'x-small',
          resizeTarget: { widgetID: 'target', width: 'x-large' },
        }),
      )
      expect(dashboard.currentLayout[moveToIndex].item).toMatchObject({
        id: 'active',
        width: 'x-small',
      })
      expect(dashboard.currentLayout.find(({ item }) => item.id === 'target')?.item.width).toBe(
        'x-large',
      )
      expect(initialLayout[0].item.width).toBe('full')
    } finally {
      act(() => root.unmount())
    }
  },
)

it('should resize a full-width target when inserting a drawer widget beside it', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  const root = createRoot(document.createElement('div'))
  const initialLayout: WidgetInstanceClient[] = [
    {
      component: null,
      item: { id: 'target', width: 'full', minWidth: 'x-small', maxWidth: 'full' },
    },
  ]
  let dashboard!: ReturnType<typeof useDashboardLayout>
  const Harness = () => {
    dashboard = useDashboardLayout(initialLayout)
    return null
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    act(() => dashboard.setIsEditing(true))
    act(() =>
      dashboard.addWidget({
        widgetSlug: 'collection-query',
        index: 1,
        width: 'x-small',
        resizeTarget: { widgetID: 'target', width: 'x-large' },
      }),
    )
    expect(dashboard.currentLayout.map(({ item }) => item.width)).toEqual(['x-large', 'x-small'])
    expect(initialLayout[0].item.width).toBe('full')
  } finally {
    act(() => root.unmount())
  }
})

it('should persist a new row even when the widget order and widths stay unchanged', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  openModal.mockClear()
  setPreference.mockClear()
  const root = createRoot(document.createElement('div'))
  const initialLayout: WidgetInstanceClient[] = [
    { component: null, item: { id: 'a', width: 'x-small', minWidth: 'x-small', maxWidth: 'full' } },
    { component: null, item: { id: 'b', width: 'x-small', minWidth: 'x-small', maxWidth: 'full' } },
  ]
  let dashboard!: ReturnType<typeof useDashboardLayout>
  const Harness = () => {
    dashboard = useDashboardLayout(initialLayout)
    return null
  }

  try {
    act(() => root.render(React.createElement(Harness)))
    act(() => dashboard.setIsEditing(true))
    act(() =>
      dashboard.moveWidget({
        moveFromIndex: 1,
        moveToIndex: 1,
        overID: 'a-row-after',
        width: 'x-small',
      }),
    )
    expect(dashboard.currentLayout[1].item.startsNewRow).toBe(true)
    act(() => dashboard.cancel())
    expect(openModal).toHaveBeenCalledWith('cancel-dashboard-changes')
    await act(async () => dashboard.saveLayout())
    expect(setPreference).toHaveBeenCalledWith(
      'dashboard-layout',
      { layouts: [initialLayout[0].item, { ...initialLayout[1].item, startsNewRow: true }] },
      false,
    )
  } finally {
    act(() => root.unmount())
  }
})
