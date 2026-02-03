'use client'
import type { LexicalEditorViewMap, ViewMapBlockComponentProps } from '@payloadcms/richtext-lexical'
import type { BlockNode } from '@payloadcms/richtext-lexical/client'

import type { LexicalViewsFrontendNodes } from './index.js'

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
        customAdminComponentBlock: {
          // Block works for both editor and JSX converter modes
          // Use isEditor to discriminate - blockContext available in editor mode
          Block: (props: ViewMapBlockComponentProps) => {
            if (props.isEditor) {
              // Editor mode - blockContext is available
              const { BlockCollapsible, EditButton, RemoveButton } = props.blockContext
              return (
                <BlockCollapsible>
                  <div style={{ padding: '16px' }}>
                    <p>Custom Block for: {props.nodeKey}</p>
                    <p>Form data: {JSON.stringify(props.formData)}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <EditButton />
                      <RemoveButton />
                    </div>
                  </div>
                </BlockCollapsible>
              )
            }
            // JSX converter mode - readonly frontend render
            return (
              <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
                <p>Custom Block (readonly)</p>
                <p>Form data: {JSON.stringify(props.formData)}</p>
              </div>
            )
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
