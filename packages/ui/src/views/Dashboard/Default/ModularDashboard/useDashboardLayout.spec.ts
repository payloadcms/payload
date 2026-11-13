// @vitest-environment jsdom
import React, { act, Suspense, use } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import type { WidgetInstanceClient } from './index.client.js'

import { useDashboardLayout } from './useDashboardLayout.js'

vi.mock('payload/shared', () => ({ PREFERENCE_KEYS: { DASHBOARD_LAYOUT: 'dashboard-layout' } }))
vi.mock('../../../../elements/ConfirmationModal/index.js', () => ({
  ConfirmationModal: () => null,
}))
vi.mock('../../../../elements/Modal/index.js', () => ({ useModal: () => ({ openModal: vi.fn() }) }))
vi.mock('../../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: { admin: { dashboard: { widgets: [{ slug: 'collection-query' }] } } },
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

it('should keep showing the current widgets while a new layout from the server is still loading', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  const root = createRoot(container)
  const item = { id: 'activity-1', maxWidth: 'full', minWidth: 'full', width: 'full' } as const
  // Stands in for a widget whose server-rendered content is still streaming
  const pending = new Promise<React.ReactNode>(() => {})
  const PendingWidget = () => use(pending)

  const Harness = ({ layout }: { layout: WidgetInstanceClient[] }) => {
    const { currentLayout } = useDashboardLayout(layout)
    return currentLayout.map(({ component, item }) =>
      React.createElement(React.Fragment, { key: item.id }, component),
    )
  }
  const render = (layout: WidgetInstanceClient[]) =>
    root.render(
      React.createElement(
        Suspense,
        { fallback: 'fallback' },
        React.createElement(Harness, { layout }),
      ),
    )

  try {
    act(() => render([{ component: 'ready', item }]))
    expect(container.textContent).toBe('ready')

    act(() => render([{ component: React.createElement(PendingWidget), item }]))
    expect(container.textContent).toBe('ready')
  } finally {
    act(() => root.unmount())
  }
})
