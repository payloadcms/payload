import type { ReactNode } from 'react'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PublishButton } from './index.js'

const mocks = vi.hoisted(() => ({
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
    }: {
      children?: ReactNode
      onClick?: () => Promise<void>
    }) => {
      mocks.primaryAction = onClick

      return createElement('button', null, children)
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
    Button: () => null,
    ButtonGroup: () => null,
  },
}))

describe('PublishButton', () => {
  beforeEach(() => {
    mocks.primaryAction = undefined
    mocks.submit.mockReset()
    mocks.submit.mockResolvedValue(true)
  })

  it('should publish only the active locale on the first render', async () => {
    const markup = renderToStaticMarkup(createElement(PublishButton))

    expect(mocks.primaryAction).toBeDefined()
    await mocks.primaryAction!()

    expect(mocks.submit).toHaveBeenCalledOnce()
    expect(mocks.submit.mock.calls[0]?.[0]?.action).toBe(
      '/api/localized/document-id?depth=0&locale=en',
    )
    expect(markup).toContain('Publish in English')
  })
})
