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
    t: (key: string) =>
      key === 'authentication:apiKeyGeneratedOnSave'
        ? 'Save this document to generate an API key.'
        : key,
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
  it('should show an empty pending state until the API key is generated on save', async () => {
    await act(async () => {
      root.render(
        React.createElement(APIKey, {
          canGenerate: true,
          enabled: true,
          isFormModified: true,
          onGenerated: vi.fn(),
          value: undefined,
        }),
      )
      await Promise.resolve()
      await Promise.resolve()
    })

    const input = container.querySelector('input')

    expect(input?.value).toBe('')
    expect(input?.placeholder).toBe('')
    expect(container.textContent).toContain('Save this document to generate an API key.')
    expect(container.querySelector('[aria-label="Show API key"]')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
    expect(setData).not.toHaveBeenCalled()
  })
})
