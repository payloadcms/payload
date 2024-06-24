'use client'
import type { AcceptedLanguages } from '@payloadcms/translations'
import type { ReactSelectOption } from '@payloadcms/ui'
import type { LanguageOptions } from 'payload'

import { ReactSelect, useTranslation } from '@payloadcms/ui'
import React from 'react'

export const LanguageSelector: React.FC<{
  languageOptions: LanguageOptions
}> = (props) => {
  const { languageOptions } = props

  const { i18n, switchLanguage } = useTranslation()

  return (
    <ReactSelect
      inputId="language-select"
      isClearable={false}
      onChange={async (option: ReactSelectOption<AcceptedLanguages>) => {
        await switchLanguage(option.value)
      }}
      options={languageOptions}
      value={languageOptions.find((language) => language.value === i18n.language)}
    />
  )
}
