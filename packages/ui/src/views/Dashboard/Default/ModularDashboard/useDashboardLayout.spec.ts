// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import type { WidgetInstanceClient } from './index.client.js'

import { useDashboardLayout } from './useDashboardLayout.js'

vi.mock('payload/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('payload/shared')>()),
  PREFERENCE_KEYS: { DASHBOARD_LAYOUT: 'dashboard-layout' },
}))
vi.mock('../../../../elements/ConfirmationModal/index.js', () => ({
  ConfirmationModal: () => null,
}))
vi.mock('../../../../elements/Modal/index.js', () => ({ useModal: () => ({ openModal: vi.fn() }) }))
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
  usePreferences: () => ({ setPreference: vi.fn() }),
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
      dashboard.addWidget('collection-query')
      dashboard.addWidget('collection-query')
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
