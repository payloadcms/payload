import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { EditIcon } from './index.js'

const icon24PathDerivedFromIcon16EditObject =
  'M14.80371 4.08657C15.39285 3.60603 16.26135 3.63993 16.8105 4.1891L19.8105 7.1891C20.3961 7.77491 20.39625 8.72446 19.8105 9.3102L10.06054 19.0602C9.77927 19.34145 9.39774 19.4997 9 19.4997H6C5.17169 19.4997 4.50019 18.82785 4.5 17.9997V14.99966C4.5 14.6019 4.65827 14.22039 4.93945 13.9391L14.68946 4.1891L14.80371 4.08657ZM6 14.99966V17.9997H9L15.96975 11.02992L12.96972 8.02992L6 14.99966ZM14.03028 6.96938L17.03025 9.96937L18.75 8.24966L15.75 5.24965L14.03028 6.96938Z'

describe('EditIcon', () => {
  it('should scale the 16px edit-object path for the 24px icon', () => {
    const markup = renderToStaticMarkup(createElement(EditIcon, { size: 24 }))

    expect(markup).toContain(`d="${icon24PathDerivedFromIcon16EditObject}"`)
  })
})
