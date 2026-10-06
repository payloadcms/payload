import type { I18n } from '@payloadcms/translations'
import type { BasePayload, Config, LanguageOptions, User } from 'payload'

import React from 'react'

/* eslint-disable payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds */
import {
  FieldLabel,
  AccountLanguageSelector as LanguageSelector,
  AccountResetPreferences as ResetPreferences,
  AccountToggleHighContrast as ToggleHighContrast,
  AccountToggleTheme as ToggleTheme,
} from '../../../exports/client/index.js'
/* eslint-enable payload/no-imports-from-exports-dir */
import './index.css'

const baseClass = 'payload-settings'

export const Settings: React.FC<{
  readonly className?: string
  readonly i18n: I18n
  readonly languageOptions: LanguageOptions
  readonly payload: BasePayload
  readonly theme: Config['admin']['theme']
  readonly user?: User
}> = (props) => {
  const { className, i18n, languageOptions, theme, user } = props

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <h3>{i18n.t('general:payloadSettings')}</h3>
      <div className={`${baseClass}__language`}>
        <FieldLabel htmlFor="language-select" label={i18n.t('general:language')} />
        <LanguageSelector languageOptions={languageOptions} />
      </div>
      {theme === 'all' && <ToggleTheme />}
      <ToggleHighContrast />
      <ResetPreferences user={user} />
    </div>
  )
}
