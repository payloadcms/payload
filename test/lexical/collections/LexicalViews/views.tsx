'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

import type { LexicalViewsNodes } from './index.js'

export const lexicalViews: LexicalEditorViewMap<LexicalViewsNodes> = {
  default: {
    nodes: {
      blocks: {
        viewsTestBlock: {
          Component: () => {
            return <div>This block is always a div</div>
          },
        },
      },
      heading: {
        createDOM() {
          const h2 = document.createElement('h2')
          h2.textContent = 'This custom heading is always an h2'
          return h2
        },
        html() {
          return '<span>This will <b>only</b> be used in the JSX converter, due to presence of createDOM</span>'
        },
      },
      horizontalrule: {
        Component: () => {
          return <div>This custom horizontal rule is always a div</div>
        },
      },
      link: {
        html() {
          return '<a href="https://www.payloadcms.com">This custom link always links to payloadcms.com</a>'
        },
      },
    },
  },
}
