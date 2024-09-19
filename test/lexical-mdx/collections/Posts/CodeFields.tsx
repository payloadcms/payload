'use client'

import type { CodeFieldClientProps } from 'payload'

import { CodeField, useFormFields } from '@payloadcms/ui'
import React, { useMemo } from 'react'

import { languages } from './shared.js'

const languageKeyToMonacoLanguageMap = {
  plaintext: 'plaintext',
  ts: 'typescript',
  tsx: 'typescript',
}

export const Code: React.FC<CodeFieldClientProps> = ({ field }) => {
  const languageField = useFormFields(([fields]) => fields['language'])

  const language: string =
    (languageField?.value as string) || (languageField.initialValue as string) || 'typescript'

  const label = languages[language as keyof typeof languages]

  const props: typeof field = useMemo(
    () => ({
      ...field,
      admin: {
        ...field.admin,
        components: field.admin?.components || {},
        editorOptions: field.admin?.editorOptions || {},
        label,
        language: languageKeyToMonacoLanguageMap[language] || language,
      },
    }),
    [field, language, label],
  )

  const key = `${field.name}-${language}-${label}`

  return <CodeField field={props} key={key} />
}
