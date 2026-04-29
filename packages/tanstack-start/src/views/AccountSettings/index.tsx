'use client'

import { FieldLabel, useAuth, useConfig, useTranslation } from '@payloadcms/ui'
import { ResetPreferences } from '@payloadcms/ui/views/Account/ResetPreferences'
import { LanguageSelector } from '@payloadcms/ui/views/Account/Settings/LanguageSelector'
import { ToggleTheme } from '@payloadcms/ui/views/Account/ToggleTheme'
import React from 'react'

const baseClass = 'payload-settings'

export const AccountSettings: React.FC = () => {
  const { i18n, languageOptions } = useTranslation()
  const { user } = useAuth()
  const {
    config: {
      admin: { theme },
    },
  } = useConfig()

  return (
    <div className={baseClass}>
      <h3>{i18n.t('general:payloadSettings')}</h3>
      <div className={`${baseClass}__language`}>
        <FieldLabel htmlFor="language-select" label={i18n.t('general:language')} />
        <LanguageSelector languageOptions={languageOptions} />
      </div>
      {theme === 'all' && <ToggleTheme />}
      <ResetPreferences user={user ?? undefined} />
    </div>
  )
}
