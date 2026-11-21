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

it('should keep preview controls outside the card button and out of keyboard navigation', () => {
  const container = document.createElement('div')

  container.innerHTML = renderToStaticMarkup(
    React.createElement(ThumbnailCard, {
      label: 'Sales',
      shouldRenderThumbnailOutsideButton: true,
      thumbnail: React.createElement('button', null, 'Preview action'),
    }),
  )
  const button = container.querySelector('.thumbnail-card')!
  const preview = container.querySelector('.thumbnail-card__preview')!

  expect(button.querySelector('button')).toBeNull()
  expect(button.textContent).toBe('Sales')
  expect(preview.getAttribute('aria-hidden')).toBe('true')
  expect(preview.hasAttribute('inert')).toBe(true)
  expect(preview.querySelector('button')?.textContent).toBe('Preview action')
})
