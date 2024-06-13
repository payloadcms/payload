'use client'
import type { LanguageOptions } from 'payload'

import { ReactSelect, useTranslation } from '@payloadcms/ui/client'
import React from 'react'

export const LanguageSelector: React.FC<{
  languageOptions: LanguageOptions
}> = (props) => {
  const { languageOptions } = props

  const { i18n, switchLanguage } = useTranslation()

  return (
    <ReactSelect
      inputId="language-select"
      onChange={async ({ value }) => {
        await switchLanguage(value)
      }}
      options={languageOptions}
      value={languageOptions.find((language) => language.value === i18n.language)}
    />
  )
}
