'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

import type { LexicalViewsFrontendNodes } from './index.js'

import { BannerBlockComponent } from './BannerBlock.js'

export const lexicalFrontendViews: LexicalEditorViewMap<LexicalViewsFrontendNodes> = {
  frontend: {
    admin: {
      hideGutter: true,
    },
    // Using function form - no need to import defaultEditorLexicalConfig!
    lexical: (defaultConfig) => ({
      ...defaultConfig,
      theme: {
        ...defaultConfig.theme,
        link: 'frontend-link',
        paragraph: 'frontend-paragraph',
      },
    }),
    nodes: {
      blocks: {
        banner: {
          Block: BannerBlockComponent,
        },
      },
      heading: {
        createDOM(args) {
          const { node } = args
          // @ts-expect-error - accessing heading-specific method
          const tag = node.getTag()
          const heading = document.createElement(tag)

          // Make headings blueish
          heading.style.color = '#3b82f6'
          heading.style.borderBottom = '2px solid #60a5fa'
          heading.style.paddingBottom = '8px'
          heading.style.marginBottom = '16px'

          return heading
        },
      },
    },
  },
}
