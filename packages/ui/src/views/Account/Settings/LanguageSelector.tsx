'use client'
import type { AcceptedLanguages } from '@payloadcms/translations'
import type { LanguageOptions } from 'payload'

import React from 'react'

import type { Option as ReactSelectOption } from '../../../elements/ReactSelect/index.js'

import { ReactSelect } from '../../../elements/ReactSelect/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

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
