import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { ClearIndicator } from '../ClearIndicator/index.js'
import { DropdownIndicator } from './index.js'

const indicatorInnerProps = {
  'aria-hidden': 'true',
  onMouseDown: () => {},
  onTouchEnd: () => {},
}

describe('DropdownIndicator', () => {
  it('does not forward react-select aria-hidden onto the focusable button', () => {
    const html = renderToStaticMarkup(
      createElement(DropdownIndicator, {
        innerProps: indicatorInnerProps,
      } as unknown as Parameters<typeof DropdownIndicator>[0]),
    )
    expect(html).not.toContain('aria-hidden')
    expect(html).toContain('aria-label="general:open"')
  })
})

describe('ClearIndicator', () => {
  it('does not forward react-select aria-hidden onto the focusable control', () => {
    const html = renderToStaticMarkup(
      createElement(ClearIndicator, {
        clearValue: () => {},
        innerProps: indicatorInnerProps,
      } as unknown as Parameters<typeof ClearIndicator>[0]),
    )
    expect(html).not.toContain('aria-hidden')
  })
})
