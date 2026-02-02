'use client'
import type { LexicalEditorViewMap } from '@payloadcms/richtext-lexical'

import { type BlockNode, defaultEditorLexicalConfig } from '@payloadcms/richtext-lexical/client'

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

export const lexicalFrontendViews: LexicalEditorViewMap<LexicalViewsNodes> = {
  frontend: {
    admin: {
      hideGutter: true,
    },
    lexical: {
      ...defaultEditorLexicalConfig,
      theme: {
        ...defaultEditorLexicalConfig.theme,
        link: 'frontend-link',
        paragraph: 'frontend-paragraph',
      },
    },
    nodes: {
      blocks: {
        customAdminComponentBlock: {
          Block: () => {
            return <div>testtt</div>
          },
        },
        viewsTestBlock: {
          Component: (args) => {
            const nodeFields: any = args?.isEditor
              ? (args.node as BlockNode).__fields
              : args.node.fields
            const text = nodeFields?.text || 'No text provided'
            return (
              <div
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  color: 'white',
                  margin: '16px 0',
                  padding: '24px',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                  <span aria-label="artist palette" role="img">
                    🎨
                  </span>{' '}
                  Custom Frontend View
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>{text}</div>
                <div style={{ fontSize: '12px', marginTop: '12px', opacity: 0.7 }}>
                  This block looks completely different in the frontend view!
                </div>
              </div>
            )
          },
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
