import type { HierarchyContents } from 'payload'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'

import { HierarchyContentsTree } from './index.js'

const controls = vi.hoisted(() => ({
  errors: [] as string[],
  hasExpandedGroups: false,
  loadMore: vi.fn(),
}))

vi.mock('./useHierarchyContentsTree.js', () => ({
  allSourcesKey: '*',
  branchKey: ({ id }: { id: null | number | string }) => JSON.stringify(id),
  useHierarchyContentsTree: ({ initialContents }: { initialContents: HierarchyContents }) => ({
    branches: {
      [JSON.stringify(initialContents.parentID)]: {
        errors: controls.errors,
        pending: [],
        sources: initialContents.sources,
      },
    },
    expanded: new Set(),
    isGroupExpanded: () => controls.hasExpandedGroups,
    loadMore: controls.loadMore,
    toggle: vi.fn(),
    toggleGroup: vi.fn(),
  }),
}))

vi.mock('../../../providers/DocumentSelection/index.js', () => ({
  SelectAllStatus: { AllInPage: 'allInPage', None: 'none', Some: 'some' },
  useDocumentSelection: () => ({
    getSelectAllStatus: () => 'none',
    isLocked: () => false,
    isSelected: () => false,
    toggleAllInCollection: vi.fn(),
    toggleSelection: vi.fn(),
  }),
}))

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: { routes: { admin: '/admin' } },
    getEntityConfig: ({ collectionSlug }: { collectionSlug: string }) => ({
      admin: { useAsTitle: 'title' },
      hierarchy: { parentFieldName: 'container' },
      labels: {
        plural: collectionSlug === 'containers' ? { en: 'Libraries' } : () => 'Articles',
      },
    }),
  }),
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => key,
  }),
}))

vi.mock('../../../elements/Link/index.js', async () => {
  const { createElement: element } = await import('react')

  return {
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
      element('a', { href }, children),
  }
})

const contents: HierarchyContents = {
  parentID: null,
  sources: [
    {
      collectionSlug: 'containers',
      docs: [{ id: 1, title: 'Reference library' }],
      hasNextPage: false,
      page: 1,
      totalDocs: 1,
      totalPages: 1,
    },
    {
      collectionSlug: 'articles',
      docs: [{ id: 2, title: 'An article' }],
      hasNextPage: true,
      page: 1,
      totalDocs: 12,
      totalPages: 2,
    },
  ],
}

beforeEach(() => {
  controls.errors = []
  controls.hasExpandedGroups = false
})

test('should use configured container labels and small icon in separate root sections', () => {
  const html = renderToStaticMarkup(
    createElement(HierarchyContentsTree, {
      collectionSlug: 'containers',
      initialContents: contents,
      selectedTypes: ['articles'],
      SmallIcon: createElement('span', null, 'Configured small icon'),
    }),
  )

  expect(html).toContain('Libraries</h2>')
  expect(html).toContain('general:unassigned</h2>')
  expect(html).toContain('Configured small icon')
  expect(html).toContain('container=1')
  expect(html).not.toContain('Folders')
})

test('should preserve a collapsed source group within a custom container', () => {
  const html = renderToStaticMarkup(
    createElement(HierarchyContentsTree, {
      collectionSlug: 'containers',
      initialContents: { ...contents, parentID: 3 },
      selectedTypes: ['articles'],
    }),
  )

  expect(html).toContain('general:expand: Articles')
  expect(html).not.toContain('An article')
  expect(html).toContain('Reference library')
})

test('should hide excluded source groups while preserving container navigation', () => {
  const html = renderToStaticMarkup(
    createElement(HierarchyContentsTree, {
      collectionSlug: 'containers',
      initialContents: { ...contents, parentID: 3 },
      selectedTypes: [],
    }),
  )

  expect(html).not.toContain('Articles')
  expect(html).toContain('Reference library')
})

test('should identify the failed source and preserve its authorized counts', () => {
  controls.errors = ['articles']
  controls.hasExpandedGroups = true

  const html = renderToStaticMarkup(
    createElement(HierarchyContentsTree, {
      collectionSlug: 'containers',
      initialContents: { ...contents, parentID: 3 },
      selectedTypes: ['articles'],
    }),
  )

  expect(html).toContain('aria-label="general:retry: Articles"')
  expect(html).toContain('role="alert">error:loadingItems')
  expect(html).toContain('1 general:of 12 Articles')
  expect(html).toContain('/admin/collections/articles/2')
})

test('should preserve a read-only list’s disabled selection configuration', () => {
  const html = renderToStaticMarkup(
    createElement(HierarchyContentsTree, {
      collectionSlug: 'containers',
      enableRowSelections: false,
      initialContents: contents,
      selectedTypes: ['articles'],
    }),
  )

  expect(html).not.toContain('data-column="_select"')
  expect(html).not.toContain('type="checkbox"')
  expect(html).toContain('Reference library')
})

test('should encode custom document IDs while retaining numeric zero links', () => {
  controls.hasExpandedGroups = true
  const id = 'section/intro?lang=en#overview'
  const html = renderToStaticMarkup(
    createElement(HierarchyContentsTree, {
      collectionSlug: 'containers',
      initialContents: {
        parentID: 3,
        sources: [
          {
            collectionSlug: 'articles',
            docs: [
              { id, title: 'Custom ID' },
              { id: 0, title: 'Zero ID' },
            ],
            hasNextPage: false,
            page: 1,
            totalDocs: 2,
            totalPages: 1,
          },
        ],
      },
      selectedTypes: ['articles'],
    }),
  )

  expect(html).toContain(`href="/admin/collections/articles/${encodeURIComponent(id)}"`)
  expect(html).toContain('href="/admin/collections/articles/0"')
})
