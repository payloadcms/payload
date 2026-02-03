'use client'
import type { LexicalEditorViewMap, ViewMapBlockComponentProps } from '@payloadcms/richtext-lexical'
import type { BlockNode } from '@payloadcms/richtext-lexical/client'

import { RichText } from '@payloadcms/richtext-lexical/react'

import type { BannerBlock } from '../../payload-types.js'
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
        banner: {
          Block: (props: ViewMapBlockComponentProps) => {
            const formData = props.formData as unknown as BannerBlock

            if (props.isEditor) {
              // Editor mode - render a simple placeholder
              const { BlockCollapsible, EditButton, RemoveButton } =
                props.useBlockComponentContext()

              const isImportant = formData?.type === 'important'

              return (
                <BlockCollapsible>
                  <div
                    style={{
                      backgroundColor: isImportant ? '#fef2f2' : '#f0f9ff',
                      borderLeft: `4px solid ${isImportant ? '#ef4444' : '#3b82f6'}`,
                      padding: '16px',
                    }}
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{isImportant ? '⚠️' : 'ℹ️'}</span>
                      <strong>{formData?.title || 'Untitled Banner'}</strong>
                      <span
                        style={{
                          backgroundColor: isImportant ? '#ef4444' : '#3b82f6',
                          borderRadius: '4px',
                          color: 'white',
                          fontSize: '11px',
                          marginLeft: 'auto',
                          padding: '2px 8px',
                        }}
                      >
                        {isImportant ? 'Important' : 'Normal'}
                      </span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      [Rich text content - edit to modify]
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <EditButton />
                      <RemoveButton />
                    </div>
                  </div>
                </BlockCollapsible>
              )
            }

            // JSX converter mode - full frontend render
            const isImportant = formData?.type === 'important'

            return (
              <div
                style={{
                  backgroundColor: isImportant ? '#fef2f2' : '#f0f9ff',
                  borderLeft: `4px solid ${isImportant ? '#ef4444' : '#3b82f6'}`,
                  borderRadius: '8px',
                  margin: '16px 0',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{isImportant ? '⚠️' : 'ℹ️'}</span>
                  <h3
                    style={{
                      color: isImportant ? '#b91c1c' : '#1d4ed8',
                      fontSize: '18px',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {formData?.title || 'Banner'}
                  </h3>
                </div>
                <div style={{ color: '#374151', lineHeight: 1.6 }}>
                  {formData?.content ? (
                    <RichText data={formData.content} />
                  ) : (
                    <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No content</p>
                  )}
                </div>
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
