'use client'

import { useForm } from '@payloadcms/ui'
import React from 'react'

export const ClearState = ({ fieldName }: { fieldName: string }) => {
  const { dispatchFields, fields } = useForm()

  const clearState = React.useCallback(() => {
    dispatchFields({
      type: 'REPLACE_STATE',
      state: {
        ...fields,
        [fieldName]: {
          ...fields[fieldName],
          initialValue: null,
          value: null,
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
