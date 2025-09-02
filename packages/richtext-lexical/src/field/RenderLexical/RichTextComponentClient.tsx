'use client'

import type { FormState } from 'payload'

import { Form } from '@payloadcms/ui'
import React from 'react'

import { buildEditorState } from '../../utilities/buildEditorState.js'

/**
 * @experimental - may break in minor releases
 */
export const RichTextComponentClient: React.FC<{
  FieldComponent: React.ReactNode
}> = (props) => {
  const { FieldComponent } = props

  const [initialState] = React.useState<FormState>(() => {
    const lexical = buildEditorState({ text: 'Hello world' })

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
