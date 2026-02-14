'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

export const lexicalProviderViews: LexicalEditorViewMap = {
  frontend: {
    admin: {
      hideGutter: true,
    },
    nodes: {
      heading: {
        createDOM(args) {
          const { node } = args
          // @ts-expect-error - accessing heading-specific method
          const tag = node.getTag()
          const heading = document.createElement(tag)

          // Make headings greenish to distinguish from LexicalViewsFrontend's blue headings
          heading.style.color = '#10b981'
          heading.style.borderBottom = '2px solid #34d399'
          heading.style.paddingBottom = '8px'
          heading.style.marginBottom = '16px'

          return heading
        },
      },
    },
  },
}
