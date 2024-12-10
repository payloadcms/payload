import type { I18n } from '@payloadcms/translations'
import type { Config, LanguageOptions } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

import { ToggleTheme } from '../ToggleTheme/index.js'
import './index.scss'
import { LanguageSelector } from './LanguageSelector.js'

const baseClass = 'payload-settings'

export const Settings: React.FC<{
  readonly className?: string
  readonly i18n: I18n
  readonly languageOptions: LanguageOptions
  readonly theme: Config['admin']['theme']
}> = (props) => {
  const { className, i18n, languageOptions, theme } = props

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <h3>{i18n.t('general:payloadSettings')}</h3>
      <div className={`${baseClass}__language`}>
        <FieldLabel htmlFor="language-select" label={i18n.t('general:language')} />
        <LanguageSelector languageOptions={languageOptions} />
      </div>
      {theme === 'all' && <ToggleTheme />}
    </div>
  )
}
