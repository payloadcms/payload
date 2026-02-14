'use client'
import type { ViewMapBlockComponentProps } from '@payloadcms/richtext-lexical'
import type { BlockComponentContextType } from '@payloadcms/richtext-lexical/react'

import { useLexicalEditable } from '@payloadcms/richtext-lexical/lexical/react/useLexicalEditable'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { RenderFields } from '@payloadcms/ui'
import React from 'react'

/**
 * Renders a single field from the block's form schema in editor mode.
 */
const EditorField: React.FC<{
  fieldName: string
  useBlockComponentContext: () => BlockComponentContextType
}> = ({ fieldName, useBlockComponentContext }) => {
  // eslint-disable-next-line react-compiler/react-compiler -- useCtx is a stable context hook passed as prop
  const { formSchema } = useBlockComponentContext()
  const isEditable = useLexicalEditable()

  const filteredSchema = formSchema.filter((field) => 'name' in field && field.name === fieldName)

  return (
    <RenderFields
      fields={filteredSchema}
      forceRender={true}
      parentIndexPath=""
      parentPath=""
      parentSchemaPath=""
      permissions={true}
      readOnly={!isEditable}
    />
  )
}

/**
 * Renders the banner content - either via RenderFields (editor) or RichText (frontend).
 */
const BannerContent: React.FC<{
  content?: unknown
  isEditor: boolean
  useBlockComponentContext?: () => BlockComponentContextType
}> = ({ content, isEditor, useBlockComponentContext }) => {
  if (isEditor && useBlockComponentContext) {
    return <EditorField fieldName="content" useBlockComponentContext={useBlockComponentContext} />
  }

  return content ? (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <RichText data={content as any} />
  ) : (
    <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No content</p>
  )
}

/**
 * Renders the banner title - either via RenderFields (editor) or plain text (frontend).
 */
const BannerTitle: React.FC<{
  isEditor: boolean
  isImportant: boolean
  title?: string
  useBlockComponentContext?: () => BlockComponentContextType
}> = ({ isEditor, isImportant, title, useBlockComponentContext }) => {
  if (isEditor && useBlockComponentContext) {
    return <EditorField fieldName="title" useBlockComponentContext={useBlockComponentContext} />
  }

  return (
    <h3
      style={{
        color: isImportant ? '#b91c1c' : '#1d4ed8',
        fontSize: '18px',
        fontWeight: 600,
        margin: 0,
      }}
    >
      {title || 'Banner'}
    </h3>
  )
}

export const BannerBlockComponent: React.FC<ViewMapBlockComponentProps> = (props) => {
  const formData = props.formData
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
        <BannerTitle
          isEditor={props.isEditor}
          isImportant={isImportant}
          title={formData?.title as string}
          useBlockComponentContext={props.isEditor ? props.useBlockComponentContext : undefined}
        />
      </div>
      <div style={{ color: '#374151', lineHeight: 1.6 }}>
        <BannerContent
          content={formData?.content}
          isEditor={props.isEditor}
          useBlockComponentContext={props.isEditor ? props.useBlockComponentContext : undefined}
        />
      </div>
    </div>
  )
}
