'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

/**
 * View map with multiple views for testing forced "default" view.
 * Even though "frontend" is available, parent provider forces "default".
 */
export const lexicalProviderDefaultViews: LexicalEditorViewMap = {
  frontend: {
    admin: {
      hideGutter: false,
    },
    nodes: {
      heading: {
        createDOM(args) {
          const { node } = args
          // @ts-expect-error - accessing heading-specific method
          const tag = node.getTag()
          const heading = document.createElement(tag)

          // Red theme for frontend view (should NOT be visible)
          heading.style.color = '#ef4444'
          heading.style.borderBottom = '2px solid #f87171'
          heading.style.paddingBottom = '8px'
          heading.style.marginBottom = '16px'

          return heading
        },
      },
    },
  },
}
