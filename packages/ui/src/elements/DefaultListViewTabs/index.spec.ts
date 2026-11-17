import type { ClientCollectionConfig, ClientConfig } from 'payload'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'

import { DefaultListViewTabs } from './index.js'

vi.mock('../../providers/Preferences/index.js', () => ({
  usePreferences: () => ({ setPreference: vi.fn() }),
}))
vi.mock('../../providers/RouterAdapter/index.js', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) =>
      ({ 'general:all': 'All', 'general:by': 'By', 'general:trash': 'Trash' })[key] ?? key,
  }),
}))
vi.mock('../Button/index.js', async () => {
  const { createElement } = await import('react')

  return {
    Button: ({
      children,
      disabled,
      id,
    }: {
      children: React.ReactNode
      disabled?: boolean
      id?: string
    }) => createElement('button', { disabled, id }, children),
  }
})

const collectionConfig = {
  slug: 'folders',
  hierarchy: { allowHasMany: false },
  labels: { plural: 'Folders', singular: 'Folder' },
  trash: true,
} as ClientCollectionConfig
const config = { routes: { admin: '/admin' } } as ClientConfig

test('should keep the redundant hierarchy tab hidden in the built-in Trash view', () => {
  const html = renderToStaticMarkup(
    createElement(DefaultListViewTabs, {
      collectionConfig,
      config,
      hasContentsBrowser: true,
      viewType: 'trash',
    }),
  )

  expect(html).toContain('All Folders')
  expect(html).toContain('Trash')
  expect(html).not.toContain('hierarchy-view-pill')
})

test('should preserve custom List view tabs when the server does not select the contents browser', () => {
  const html = renderToStaticMarkup(
    createElement(DefaultListViewTabs, {
      collectionConfig,
      config,
      hasContentsBrowser: false,
      viewType: 'trash',
    }),
  )

  expect(html).toContain('hierarchy-view-pill')
  expect(html).toContain('By Folder')
})
