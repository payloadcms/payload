import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { RenderTitle } from './index.js'

const mocks = vi.hoisted(() => ({ id: 17 as number | string, title: '17' }))

vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({ config: { routes: { admin: '/admin' } } }),
}))

vi.mock('../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({ collectionSlug: 'posts', id: mocks.id, isInitializing: false }),
}))

vi.mock('../../providers/DocumentTitle/index.js', () => ({
  useDocumentTitle: () => ({ isPlaceholder: false, title: mocks.title }),
}))

vi.mock('../Drawer/index.js', () => ({ useDrawerDepth: () => 0 }))

describe('RenderTitle', () => {
  it.each([17, 0, 'document-id'])('should identify an ID fallback for %s', (id) => {
    mocks.id = id
    mocks.title = String(id)

    const markup = renderToStaticMarkup(createElement(RenderTitle))

    expect(markup).toContain('render-title--has-id')
    expect(markup).toContain('id-label__prefix">ID</span>')
    expect(markup).toContain(`id-label__value">${id}</span>`)
  })

  it('should render a document title that differs from its ID', () => {
    mocks.id = 17
    mocks.title = 'Named document'

    const markup = renderToStaticMarkup(createElement(RenderTitle))

    expect(markup).toContain('Named document')
    expect(markup).not.toContain('id-label__prefix')
  })
})
