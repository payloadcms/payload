'use client'

import { RadioGroupField, useTheme, useTranslation } from '@payloadcms/ui'
import React, { useCallback } from 'react'

export const ToggleTheme: React.FC = () => {
  const { autoMode, setTheme, theme } = useTheme()
  const { t } = useTranslation()

  const onChange = useCallback(
    (newTheme) => {
      setTheme(newTheme)
    },
    [setTheme],
  )

  return (
    <RadioGroupField
      disableModifyingForm={true}
      field={{
        name: 'theme',
        label: t('general:adminTheme'),
        options: [
          {
            label: t('general:automatic'),
            value: 'auto',
          },
          {
            label: t('general:light'),
            value: 'light',
          },
          {
            label: t('general:dark'),
            value: 'dark',
          },
        ],
      }}
      onChange={onChange}
      path="theme"
      value={autoMode ? 'auto' : theme}
    />
  )
}
