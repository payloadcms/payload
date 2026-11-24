import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'

import { ItemsDrawer } from './index.js'

vi.mock('@faceless-ui/modal', () => ({
  useModal: () => ({ isModalOpen: () => true, closeModal: () => undefined }),
}))
vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: { admin: {}, blocksMap: {} } }),
}))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
}))
vi.mock('../Drawer/index.js', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock('./WidgetPreviewProvider/index.js', () => ({
  WidgetPreviewProvider: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock('./WidgetPreview/index.js', () => ({ WidgetPreview: () => null }))

it('should render one widget choice per slug from an already-duplicated config', () => {
  const markup = renderToStaticMarkup(
    React.createElement(ItemsDrawer, {
      drawerSlug: 'widgets',
      variant: 'widgets',
      onItemClick: () => undefined,
      items: [
        { slug: 'welcome', label: 'Custom welcome' },
        { slug: 'welcome', label: 'Duplicate welcome' },
        { slug: 'activity', label: 'Activity' },
        { slug: 'activity', label: 'Activity' },
      ],
    }),
  )

  expect(markup.match(/class="items-drawer__item"/g)).toHaveLength(2)
  expect(markup).toContain('Custom welcome')
  expect(markup).not.toContain('Duplicate welcome')
})
