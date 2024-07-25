import React from 'react'
import { useTranslation } from 'react-i18next'

import '../../../scss/app.scss'

const scriptLanguages = ['ar', 'fa']

export const LanguageWrap: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation()
  const currentLanguage = i18n?.language
  const isScriptLanguage = currentLanguage && scriptLanguages.includes(currentLanguage)

  if (isScriptLanguage) {
    return <div className="script-language">{children}</div>
  }

  return <React.Fragment>{children}</React.Fragment>
}
