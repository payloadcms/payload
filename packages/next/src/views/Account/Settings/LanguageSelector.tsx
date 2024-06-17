'use client'
import type { AcceptedLanguages } from '@payloadcms/translations'
import type { Option } from '@payloadcms/ui/elements/ReactSelect'
import type { LanguageOptions } from 'payload/types'

import { ReactSelect } from '@payloadcms/ui/elements/ReactSelect'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
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
      onChange={async (option: Option<AcceptedLanguages>) => {
        await switchLanguage(option.value)
      }}
      options={languageOptions}
      value={languageOptions.find((language) => language.value === i18n.language)}
    />
  )
}
