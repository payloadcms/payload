'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

export const lexicalViews: LexicalEditorViewMap = {
  default: {
    heading: {
      createDOM() {
        const h2 = document.createElement('h2')
        h2.textContent = 'This custom heading is always an h2'
        return h2
      },
    },
    horizontalRule: {
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
}
