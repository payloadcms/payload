'use client'

import type { TextFieldClientProps } from 'payload'

import { TextInput, useField } from '@payloadcms/ui'
import React from 'react'

export const ContextualTextField: React.FC<TextFieldClientProps> = ({ field }) => {
  const { path, setValue, value } = useField<string>()

  return (
    <TextInput
      label={field.label}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
      path={path}
      value={value}
    />
  )
}
