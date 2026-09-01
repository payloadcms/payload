// @vitest-environment happy-dom

import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { APIKey } from './APIKey.js'

const { setData } = vi.hoisted(() => ({
  setData: vi.fn(),
}))

vi.mock('../../../elements/GenerateConfirmation/index.js', () => ({
  GenerateConfirmation: () => null,
}))

vi.mock('../../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      routes: {
        api: '/api',
      },
    },
    getEntityConfig: () => ({
      fields: [{ name: 'apiKey', type: 'text' }],
    }),
  }),
}))

vi.mock('../../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({
    collectionSlug: 'api-keys',
    id: '1',
    setData,
  }),
}))

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => key,
  }),
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  setData.mockClear()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: async () => ({}),
      ok: true,
    }),
  )
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('APIKey', () => {
  it('should show a loading state while generating a missing API key', async () => {
    let resolveResponse: (response: Response) => void
    const responsePromise = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })
    vi.mocked(fetch).mockReturnValue(responsePromise)

    await act(async () => {
      root.render(
        React.createElement(APIKey, {
          canGenerate: true,
          enabled: true,
          generateOnEnable: true,
          isFormModified: true,
          onGenerated: vi.fn(),
          value: undefined,
        }),
      )
      await Promise.resolve()
    })

    const input = container.querySelector('input')

    expect(input?.placeholder).toBe('general:loading...')
    expect(input?.classList.contains('api-key-input__field--loading')).toBe(true)
    expect(container.querySelector('.spinner')).toBeNull()

    await act(async () => {
      resolveResponse!(
        new Response(JSON.stringify({ apiKey: 'generated-api-key' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }),
      )
      await responsePromise
      await Promise.resolve()
    })

    expect(container.querySelector('.spinner')).toBeNull()
    expect(input?.classList.contains('api-key-input__field--loading')).toBe(false)
  })
})
