import type { ReactNode } from 'react'

import type { SubmitOptions } from '../../forms/Form/types.js'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PublishButton } from './index.js'

const mocks = vi.hoisted(() => ({
  allLocalesAction: undefined as (() => Promise<void>) | undefined,
  primaryAction: undefined as (() => Promise<void>) | undefined,
  submit: vi.fn(),
}))

vi.mock('../../forms/Form/context.js', () => ({
  useForm: () => ({ submit: mocks.submit }),
  useFormModified: () => true,
}))

vi.mock('../../forms/Submit/index.js', async () => {
  const { createElement } = await import('react')

  return {
    FormSubmit: ({
      children,
      onClick,
      SubMenuPopupContent,
    }: {
      children?: ReactNode
      onClick?: () => Promise<void>
      SubMenuPopupContent?: () => ReactNode
    }) => {
      mocks.primaryAction = onClick

      return createElement(
        'div',
        null,
        createElement('button', null, children),
        SubMenuPopupContent ? createElement(SubMenuPopupContent) : null,
      )
    },
  }
})

vi.mock('../../hooks/useHotkey.js', () => ({
  useHotkey: () => undefined,
}))

vi.mock('../../providers/Config/index.js', () => ({
  useConfig: () => ({
    config: {
      localization: {
        defaultLocale: 'en',
        locales: [
          { code: 'en', label: 'English' },
          { code: 'es', label: 'Spanish' },
        ],
      },
      routes: { api: '/api' },
    },
    getEntityConfig: () => ({
      fields: [{ localized: true, name: 'title', type: 'text' }],
      versions: { drafts: { localizeStatus: true } },
    }),
  }),
}))

vi.mock('../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({
    collectionSlug: 'localized',
    hasPublishedDoc: false,
    hasPublishPermission: true,
    id: 'document-id',
    setHasPublishedDoc: vi.fn(),
    setMostRecentVersionIsAutosaved: vi.fn(),
    setUnpublishedVersionCount: vi.fn(),
    unpublishedVersionCount: 0,
    uploadStatus: 'idle',
  }),
}))

vi.mock('../../providers/EditDepth/index.js', () => ({
  useEditDepth: () => 0,
}))

vi.mock('../../providers/Locale/index.js', () => ({
  useLocale: () => ({ code: 'en', label: 'English' }),
}))

vi.mock('../../providers/Operation/index.js', () => ({
  useOperation: () => 'update',
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, variables?: { locale?: string }) => {
      if (key === 'version:publishIn') {
        return `Publish in ${variables?.locale}`
      }

      if (key === 'version:publish') {
        return 'Publish'
      }

      if (key === 'version:publishAllLocales') {
        return 'Publish all locales'
      }

      return 'Publish changes'
    },
  }),
}))

vi.mock('../Popup/index.js', () => ({
  PopupList: {
    Button: ({ id, onClick }: { id: string; onClick: () => Promise<void> }) => {
      if (id === 'publish-all-locales') {
        mocks.allLocalesAction = onClick
      }

      return null
    },
    ButtonGroup: ({ children }: { children: ReactNode }) => children,
  },
}))

describe('PublishButton', () => {
  beforeEach(() => {
    mocks.primaryAction = undefined
    mocks.allLocalesAction = undefined
    mocks.submit.mockReset()
    mocks.submit.mockResolvedValue(true)
  })

  it('should publish only the active locale on the first render', async () => {
    const markup = renderToStaticMarkup(createElement(PublishButton))

    expect(mocks.primaryAction).toBeDefined()
    await mocks.primaryAction!()

    expect(mocks.submit).toHaveBeenCalledOnce()
    expect(mocks.submit.mock.calls[0]?.[0]?.action).toBe(
      '/api/localized/document-id?depth=0&locale=en&version=draft',
    )
    expect(markup).toContain('Publish in English')
  })

  it('should submit locale-keyed form data when publishing all locales', async () => {
    renderToStaticMarkup(createElement(PublishButton))

    await mocks.allLocalesAction!()

    const options: SubmitOptions = mocks.submit.mock.calls[0]?.[0]
    const overrides = options.overrides

    expect(options.action).toBe('/api/localized/document-id?depth=0&locale=all&version=draft')
    expect(options.context).toEqual({ responseLocale: 'all' })
    expect(typeof overrides).toBe('function')

    if (typeof overrides !== 'function') {
      throw new Error('All-locales publication must replace the submitted form data.')
    }

    expect(overrides({ title: { value: 'Current English title' } })).toEqual({
      _status: 'published',
      title: { en: 'Current English title' },
    })
  })
})
