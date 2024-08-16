'use client'

import { TextField, useFieldProps, useFormFields } from '@payloadcms/ui'
import React from 'react'

export const ImageAltComponent = () => {
  const fieldProps = useFieldProps()
  const fileField = useFormFields(([fields]) => fields?.file)
  const docMimeType = useFormFields(([fields]) => fields?.mimeType)

  // @ts-expect-error
  const currentlySelectedMimeType = fileField?.value?.type || docMimeType?.value

  if (currentlySelectedMimeType && currentlySelectedMimeType.startsWith('image/')) {
    return (
      <TextField
        {...fieldProps}
        field={{
          admin: {
            description: 'A short textual description of the image',
          },
          label: 'Alt Text',
        }}
      />
    )
  }

  return null
}
