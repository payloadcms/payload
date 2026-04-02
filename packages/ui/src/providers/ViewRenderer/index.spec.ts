import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { ViewComponentRenderer } from '../../utilities/createViewRenderer.js'

import { ViewRendererProvider, useViewRenderer } from './index.js'

const RendererProbe = () => {
  const renderView = useViewRenderer()

  if (!renderView) {
    return null
  }

  return renderView({
    Fallback: () => React.createElement('span', null, 'fallback'),
  })
}

describe('ViewRendererProvider', () => {
  it('should expose the configured renderer to descendants', () => {
    const renderer: ViewComponentRenderer = () => React.createElement('span', null, 'provided')

    const markup = renderToStaticMarkup(
      React.createElement(ViewRendererProvider, {
        children: React.createElement(RendererProbe),
        renderer,
      }),
    )

    expect(markup).toBe('<span>provided</span>')
  })

  it('should return null when no renderer is configured', () => {
    const markup = renderToStaticMarkup(React.createElement(RendererProbe))

    expect(markup).toBe('')
  })
})
