'use client'

import type { SerializedParagraphNode, SerializedTextNode } from '@payloadcms/richtext-lexical'

import { useForm } from '@payloadcms/ui'
import React from 'react'

export const ClearState = ({ fieldName }: { fieldName: string }) => {
  const { dispatchFields, fields } = useForm()

  const clearState = React.useCallback(() => {
    const newState = {
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
                text: '',
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
    dispatchFields({
      type: 'REPLACE_STATE',
      state: {
        ...fields,
        [fieldName]: {
          ...fields[fieldName],
          initialValue: newState,
          value: newState,
        },
      },
    })
  }, [dispatchFields, fields, fieldName])

  return (
    <button id={`clear-lexical-${fieldName}`} onClick={clearState} type="button">
      Clear State
    </button>
  )
}
