'use client'

import type { SerializedEditorState } from 'lexical'
import type { FormState } from 'payload'

import { Form } from '@payloadcms/ui'
import React from 'react'

import type { SerializedParagraphNode, SerializedTextNode } from '../../nodeTypes.js'

export function textToLexicalJSON({ text }: { text: string }): SerializedEditorState {
  const editorJSON: SerializedEditorState = {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              version: 1,
            } as SerializedTextNode,
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          version: 1,
        } as SerializedParagraphNode,
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }

  return editorJSON
}

export const RichTextComponentClient: React.FC<{
  FieldComponent: React.ReactNode
}> = (props) => {
  const { FieldComponent } = props

  const [initialState] = React.useState<FormState>(() => {
    const lexical = textToLexicalJSON({ text: 'Hello world' })
    return {
      richText: {
        initialValue: lexical,
        valid: true,
        value: lexical,
      },
    }
  })

  const onChange: (args: { formState: FormState; submitted?: boolean }) => Promise<FormState> =
    // eslint-disable-next-line @typescript-eslint/require-await
    React.useCallback(async ({ formState }) => {
      console.log('updated form state', formState)
      return formState
    }, [])

  return (
    <Form
      el="div" // <= new in 3.26.0
      fields={[{ name: 'richText', type: 'richText' }]}
      initialState={initialState}
      onChange={[onChange]}
    >
      {FieldComponent}
    </Form>
  )
}
