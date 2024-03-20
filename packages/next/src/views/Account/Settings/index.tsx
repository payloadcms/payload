'use client'
import { ReactSelect } from '@payloadcms/ui/elements/ReactSelect'
import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React from 'react'

import { ToggleTheme } from '../ToggleTheme/index.js'
import './index.scss'

const baseClass = 'payload-settings'

export const Settings: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props

  const { i18n, languageOptions, switchLanguage, t } = useTranslation()

  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')}>
      <h3>{t('general:payloadSettings')}</h3>
      <div className={`${baseClass}__language`}>
        <FieldLabel htmlFor="language-select" label={t('general:language')} />
        <ReactSelect
          inputId="language-select"
          onChange={async ({ value }) => {
            await switchLanguage(value)
          }}
          options={languageOptions}
          value={languageOptions.find((language) => language.value === i18n.language)}
        />
      </div>
      <ToggleTheme />
    </div>
  )
}
