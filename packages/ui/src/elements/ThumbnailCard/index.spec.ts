// @vitest-environment jsdom
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'

import { ThumbnailCard } from './index.js'

vi.mock('../../providers/Config/index.js', () => ({ useConfig: () => ({ config: { admin: {} } }) }))
vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}))

it('should associate a widget description with its button while keeping its name as the title', () => {
  const container = document.createElement('div')

  container.innerHTML = renderToStaticMarkup(
    React.createElement(ThumbnailCard, {
      description: 'Display the total number of documents in a collection.',
      label: 'Count Widget',
      onClick: () => undefined,
      thumbnail: null,
    }),
  )
  const button = container.querySelector('button')!
  const descriptionID = button.getAttribute('aria-describedby')!

  expect(button.getAttribute('aria-label')).toBe('Count Widget')
  expect(container.querySelector(`[id="${descriptionID}"]`)?.textContent).toBe(
    'Display the total number of documents in a collection.',
  )
  expect(button.type).toBe('button')
})

it('should retain the existing label behavior for cards without descriptions', () => {
  const container = document.createElement('div')

  container.innerHTML = renderToStaticMarkup(
    React.createElement(ThumbnailCard, { label: 'Existing block', thumbnail: null }),
  )
  const button = container.querySelector('button')!

  expect(button.hasAttribute('aria-label')).toBe(false)
  expect(button.hasAttribute('aria-describedby')).toBe(false)
  expect(button.textContent).toBe('Existing block')
})
