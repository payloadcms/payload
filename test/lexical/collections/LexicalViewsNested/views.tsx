'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

/**
 * View map for nested richtext field inside blocks.
 * Used to verify that nested richtext with views keeps its ViewSelector
 * when parent richtext has no views configured.
 */
export const lexicalNestedViews: LexicalEditorViewMap = {
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

          // Purple theme for nested views
          heading.style.color = '#a855f7'
          heading.style.borderBottom = '2px solid #c084fc'
          heading.style.paddingBottom = '8px'
          heading.style.marginBottom = '16px'

          return heading
        },
      },
    },
  },
}
