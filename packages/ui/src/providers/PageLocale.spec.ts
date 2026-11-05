import type { Locale, ServerFunctionClient } from 'payload'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LocaleContext, useLocale } from './Locale/index.js'
import { PageLocaleProvider } from './PageLocale/index.js'
import { ServerFunctionsProvider, useServerFunctions } from './ServerFunctions/index.js'

const serverFunction = vi.fn()

const { config } = vi.hoisted(() => ({
  config: { localization: { locales: [{ code: 'en' }, { code: 'es' }] } },
}))

vi.mock('./Config/index.js', () => ({ useConfig: () => ({ config }) }))

vi.mock('./Auth/index.js', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('next/navigation.js', () => ({ useSearchParams: () => new URLSearchParams() }))
vi.mock('payload/shared', () => ({ formatAdminURL: () => '' }))

function Consumer({ name }: { name: string }) {
  return React.createElement('span', { 'data-consumer': name }, useLocale().code)
}

const consume = (name: string) => React.createElement(Consumer, { key: name, name })

function renderPage(children: React.ReactNode, locale?: string) {
  return renderToStaticMarkup(
    React.createElement(ServerFunctionsProvider, {
      serverFunction,
      children: React.createElement(
        LocaleContext,
        { value: { code: 'es' } as Locale },
        React.createElement(PageLocaleProvider, { locale }, children),
      ),
    }),
  )
}

describe('PageLocaleProvider', () => {
  beforeEach(() => serverFunction.mockReset())
  it('should give header, list and bulk actions the rendered locale over a stale layout locale', () => {
    const output = renderPage(['header', 'list', 'bulk-edit'].map(consume), 'en')

    expect(output).toBe(
      '<span data-consumer="header">en</span><span data-consumer="list">en</span><span data-consumer="bulk-edit">en</span>',
    )
  })

  it('should scope a separately rendered drawer without changing the page locale', () => {
    const output = renderPage(
      [
        consume('before'),
        React.createElement(PageLocaleProvider, { key: 'drawer', locale: 'es' }, consume('drawer')),
        consume('after'),
      ],
      'en',
    )

    expect(output).toBe(
      '<span data-consumer="before">en</span><span data-consumer="drawer">es</span><span data-consumer="after">en</span>',
    )
  })

  it('should preserve the surrounding locale when no rendered locale is supplied', () => {
    expect(renderPage(consume('page'))).toBe('<span data-consumer="page">es</span>')
  })

  it('should send the rendered locale with server function requests', async () => {
    let request: ServerFunctionClient
    function RequestConsumer() {
      request = useServerFunctions().serverFunction
      return null
    }

    renderPage(React.createElement(RequestConsumer), 'en')
    await request({ name: 'form-state', args: {} })

    expect(serverFunction).toHaveBeenCalledWith({ name: 'form-state', args: {}, locale: 'en' })
  })

  it('should preserve a nested drawer locale through the page request boundary', async () => {
    let request: ServerFunctionClient
    function RequestConsumer() {
      request = useServerFunctions().serverFunction
      return null
    }

    renderPage(
      React.createElement(
        PageLocaleProvider,
        { locale: 'es' },
        React.createElement(RequestConsumer),
      ),
      'en',
    )
    await request({ name: 'render-document', args: {} })

    expect(serverFunction).toHaveBeenCalledWith({ name: 'render-document', args: {}, locale: 'es' })
  })
})
