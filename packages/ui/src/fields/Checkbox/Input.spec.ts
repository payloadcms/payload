import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CheckboxInput } from './Input.js'

describe('CheckboxInput', () => {
  it('should preserve explicit aria-labelledby when aria-label is provided', () => {
    const markup = renderToStaticMarkup(
      React.createElement(CheckboxInput, {
        'aria-label': 'Fallback label',
        'aria-labelledby': 'external-label',
        onToggle: () => undefined,
      }),
    )

    expect(markup).toContain('aria-label="Fallback label"')
    expect(markup).toContain('aria-labelledby="external-label"')
  })
})
