import type { I18n } from '@payloadcms/translations'
import type { LanguageOptions } from 'payload'

import { FieldLabel } from '@payloadcms/ui/client'
import React from 'react'

import { ToggleTheme } from '../ToggleTheme/index.js'
import { LanguageSelector } from './LanguageSelector.js'
import './index.scss'

const baseClass = 'payload-settings'

export const Settings: React.FC<{
  className?: string
  i18n: I18n
  languageOptions: LanguageOptions
}> = (props) => {
  const { className, i18n, languageOptions } = props

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <h3>{i18n.t('general:payloadSettings')}</h3>
      <div className={`${baseClass}__language`}>
        <FieldLabel htmlFor="language-select" label={i18n.t('general:language')} />
        <LanguageSelector languageOptions={languageOptions} />
      </div>
      <ToggleTheme />
    </div>
  )
}
