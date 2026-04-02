import type { InitReqResult } from 'payload'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { renderRootPageFromDescriptor } from './RenderRoot'

vi.mock('../../providers/Config/index.js', () => ({
  PageConfigProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('page-config', undefined, children),
}))

vi.mock('../../providers/ViewRenderer/index.js', () => ({
  ViewRendererProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('view-renderer', undefined, children),
}))

vi.mock('../../templates/Default/index.js', () => ({
  DefaultTemplate: ({ children }: { children: React.ReactNode }) =>
    React.createElement('default-template', undefined, children),
}))

vi.mock('../../templates/Minimal/index.js', () => ({
  MinimalTemplate: ({ children }: { children: React.ReactNode }) =>
    React.createElement('minimal-template', undefined, children),
}))

describe('renderRootPageFromDescriptor', () => {
  it('should wrap the rendered view with the minimal template when requested', () => {
    const markup = renderToStaticMarkup(
      renderRootPageFromDescriptor({
        descriptor: {
          browseByFolderSlugs: [],
          clientConfig: {
            routes: {
              admin: '/admin',
            },
          } as never,
          collectionConfig: undefined,
          DefaultView: {
            Component: () => React.createElement('div', undefined, 'view'),
          },
          documentSubViewType: undefined,
          globalConfig: undefined,
          routeParams: {},
          templateClassName: 'login',
          templateType: 'minimal',
          viewActions: undefined,
          viewType: undefined,
          visibleEntities: {
            collections: [],
            globals: [],
          },
        },
        importMap: {} as never,
        initPageResult: {
          cookies: new Map(),
          locale: undefined,
          permissions: {
            canAccessAdmin: true,
          },
          req: {
            i18n: {
              language: 'en',
              translations: {},
            },
            payload: {
              config: {
                i18n: {
                  supportedLanguages: {
                    en: {
                      translations: {
                        general: {
                          thisLanguage: 'English',
                        },
                      },
                    },
                  },
                },
              },
            },
            user: {
              id: '1',
            },
          },
        } as unknown as InitReqResult,
        notFound: () => {
          throw new Error('not-found')
        },
        redirect: () => {
          throw new Error('redirect')
        },
        searchParams: {},
        segments: [],
        viewRenderer: () => React.createElement('rendered-view', undefined, 'view'),
      }),
    )

    expect(markup).toContain('<page-config>')
    expect(markup).toContain('<view-renderer>')
    expect(markup).toContain('<minimal-template>')
    expect(markup).toContain('<rendered-view>view</rendered-view>')
    expect(markup).not.toContain('<default-template>')
  })
})
