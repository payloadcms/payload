'use client'
import type { LanguageOptions } from 'payload/types'

import { ReactSelect } from '@payloadcms/ui/elements/ReactSelect'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React from 'react'

export const LanguageSelector: React.FC<{
  languageOptions: LanguageOptions
}> = (props) => {
  const { languageOptions } = props

  const { i18n, switchLanguage } = useTranslation()

  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

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
