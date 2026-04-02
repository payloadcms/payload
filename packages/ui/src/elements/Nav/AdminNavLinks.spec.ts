import type { NavPreferences } from 'payload'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { EntityType } from '../../utilities/groupNavItems.js'

import { AdminNavLinks } from './AdminNavLinks'

vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      admin: {
        routes: {
          browseByFolder: '/browse-by-folder',
        },
      },
      folders: undefined,
      routes: {
        admin: '/admin',
      },
    },
  }),
}))

vi.mock('../../providers/Router/index.js', () => ({
  Link: ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children),
  usePathname: () => '/admin/collections/posts',
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
      t: (key: string) => key,
      translations: {},
    },
  }),
}))

vi.mock('../FolderView/BrowseByFolderButton/index.js', () => ({
  BrowseByFolderButton: () => null,
}))

vi.mock('../NavGroup/index.js', () => ({
  NavGroup: ({
    children,
    isOpen,
    label,
  }: {
    children: React.ReactNode
    isOpen?: boolean
    label: string
  }) =>
    React.createElement(
      'div',
      {
        className: ['nav-group', isOpen === false && 'nav-group--collapsed']
          .filter(Boolean)
          .join(' '),
        'data-label': label,
      },
      children,
    ),
}))

describe('AdminNavLinks', () => {
  it('should render collapsed groups from nav preferences', () => {
    const markup = renderToStaticMarkup(
      React.createElement(AdminNavLinks, {
        groups: [
          {
            entities: [
              {
                label: 'Posts',
                slug: 'posts',
                type: EntityType.collection,
              },
            ],
            label: 'Content',
          },
        ],
        navPreferences: {
          groups: {
            Content: {
              open: false,
            },
          },
        } as unknown as NavPreferences,
      }),
    )

    expect(markup).toContain('nav-group--collapsed')
    expect(markup).toContain('nav__link-indicator')
    expect(markup).toContain('<div class="nav__link" id="nav-posts">')
  })
})
