'use client'

import type { TextFieldClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { TextInput, useField, useTranslation } from '@payloadcms/ui'
import React from 'react'

export const PathBoundTextField: React.FC<TextFieldClientProps> = ({ field, path, readOnly }) => {
  const { disabled, setValue, value } = useField<string>({ path })
  const { i18n } = useTranslation()

  return (
    <TextInput
      label={getTranslation(field.label, i18n)}
      onChange={(event) => setValue(event.target.value)}
      path={path}
      readOnly={readOnly || disabled}
      value={value || ''}
    />
  )
}
