'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

/**
 * View map with ONLY a "default" view - no "frontend" view.
 *
 * When a parent provider forces currentView="frontend" and this editor
 * doesn't have a "frontend" view, the field should fall back to the
 * "default" view config (matching RichTextViewProvider behavior).
 */
export const lexicalProviderFallbackViews: LexicalEditorViewMap = {
  default: {
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

          heading.dataset.fallbackView = 'true'

          return heading
        },
      },
    },
  },
}
