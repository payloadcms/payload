import type { I18n } from '@payloadcms/translations'
import type { BasePayload, Config, LanguageOptions, User } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import React from 'react'

import { ResetPreferences } from '../ResetPreferences/index.js'
import './index.scss'
import { ToggleTheme } from '../ToggleTheme/index.js'
import { LanguageSelector } from './LanguageSelector.js'

const baseClass = 'payload-settings'

export const Settings: React.FC<{
  readonly className?: string
  readonly i18n: I18n
  readonly languageOptions: LanguageOptions
  readonly payload: BasePayload
  readonly theme: Config['admin']['theme']
  readonly user?: User
}> = (props) => {
  const { className, i18n, languageOptions, payload, theme, user } = props

  const apiRoute = payload.config.routes.api

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <h3>{i18n.t('general:payloadSettings')}</h3>
      <div className={`${baseClass}__language`}>
        <FieldLabel htmlFor="language-select" label={i18n.t('general:language')} />
        <LanguageSelector languageOptions={languageOptions} />
      </div>
      {theme === 'all' && <ToggleTheme />}
      <ResetPreferences apiRoute={apiRoute} user={user} />
    </div>
  )
}
