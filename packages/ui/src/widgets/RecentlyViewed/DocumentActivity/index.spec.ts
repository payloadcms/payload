// @vitest-environment happy-dom
import type { Root } from 'react-dom/client'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentActivityWidget } from './index.js'

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: { routes: { api: '/custom-api' }, serverURL: '' } }),
}))
vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key) => key }),
}))
vi.mock('../DocumentItem/index.js', () => ({
  DocumentItem: ({ doc, isPinned, onTogglePin }) =>
    createElement(
      'li',
      null,
      createElement('button', { 'aria-pressed': isPinned, onClick: onTogglePin }, doc.title),
    ),
}))
let container: HTMLDivElement
let root: Root
const request = vi.fn()
beforeEach(() => {
  request.mockReset()
  vi.stubGlobal('fetch', request)
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() =>
    root.render(
      createElement(DocumentActivityWidget, {
        documents: [
          {
            id: 1,
            collectionSlug: 'posts',
            href: '/posts/1',
            title: 'Example',
            typeLabel: 'Posts',
          },
        ],
        draftKeys: [],
        hasError: false,
        recentKeys: ['posts:1'],
        preferences: { pins: [], tab: 'recent', view: 'grid' },
      }),
    ),
  )
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  delete globalThis.IS_REACT_ACT_ENVIRONMENT
})

describe('dashboard document controls', () => {
  it('should save pins through the configured preferences endpoint', async () => {
    request.mockResolvedValue({ ok: true })
    await act(async () => container.querySelector('li button').click())
    expect(request).toHaveBeenCalledWith(
      '/custom-api/payload-preferences/dashboard-documents',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          value: { pins: [{ id: 1, collectionSlug: 'posts' }], tab: 'recent', view: 'grid' },
        }),
      }),
    )
    expect(container.querySelector('li button').getAttribute('aria-pressed')).toBe('true')
  })
  it('should keep the previous preference and show an error if saving fails', async () => {
    request.mockResolvedValue({ ok: false })
    await act(async () => container.querySelector('li button').click())
    expect(container.querySelector('li button').getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelector('[role="alert"]').textContent).toBe('dashboard:saveError')
  })
  it('should prevent overlapping preference writes', async () => {
    let resolveRequest: (value: { ok: boolean }) => void
    request.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )
    act(() => {
      container.querySelector('li button').click()
      container.querySelector('li button').click()
    })
    expect(request).toHaveBeenCalledOnce()
    await act(async () => resolveRequest({ ok: true }))
  })
  it('should support keyboard tab navigation and connect tabs to their panel', () => {
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs[1].focus()
    act(() =>
      tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })),
    )
    expect(document.activeElement).toBe(tabs[2])
    const panel = container.querySelector('[role="tabpanel"]')
    expect(tabs[1].getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[1].id)
  })
})

describe('dashboard document empty states', () => {
  it('should fill unused grid slots with non-interactive decorative cards', () => {
    const placeholders = container.querySelectorAll('.document-activity__placeholder')

    expect(placeholders).toHaveLength(7)
    for (const placeholder of placeholders) {
      expect(placeholder.getAttribute('aria-hidden')).toBe('true')
      expect(placeholder.querySelector('a, button, input, [tabindex]')).toBeNull()
    }
  })

  it('should remove placeholder cards when switching to list view', async () => {
    request.mockResolvedValue({ ok: true })
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[aria-label="dashboard:listView"]').click(),
    )

    expect(container.querySelector('.document-activity__items--list')).not.toBeNull()
    expect(container.querySelector('.document-activity__placeholder')).toBeNull()
  })

  it.each(['pinned', 'recent', 'drafts'] as const)(
    'should show the %s empty message instead of placeholder cards when no documents exist',
    (tab) => {
      act(() =>
        root.render(
          createElement(DocumentActivityWidget, {
            documents: [],
            draftKeys: [],
            hasError: false,
            key: tab,
            preferences: { pins: [], tab, view: 'grid' },
            recentKeys: [],
          }),
        ),
      )

      expect(container.querySelector('.document-activity__empty')).not.toBeNull()
      expect(container.querySelector('.document-activity__placeholder')).toBeNull()
      expect(container.querySelector('.document-activity__empty strong').textContent).toBe(
        tab === 'pinned'
          ? 'dashboard:noPinned'
          : tab === 'drafts'
            ? 'dashboard:noDrafts'
            : 'dashboard:noRecents',
      )
    },
  )

  it.each([8, 9])('should retain all %i pins without adding extra placeholder cards', (count) => {
    const documents = Array.from({ length: count }, (_, id) => ({
      id,
      collectionSlug: 'posts',
      href: `/posts/${id}`,
      title: `Post ${id}`,
      typeLabel: 'Posts',
    }))

    act(() =>
      root.render(
        createElement(DocumentActivityWidget, {
          documents,
          draftKeys: [],
          hasError: false,
          key: 'pinned',
          preferences: {
            pins: documents.map(({ id, collectionSlug }) => ({ id, collectionSlug })),
            tab: 'pinned',
            view: 'grid',
          },
          recentKeys: [],
        }),
      ),
    )

    expect(container.querySelectorAll('.document-activity__items > li')).toHaveLength(count)
    expect(container.querySelector('.document-activity__placeholder')).toBeNull()
  })
})
