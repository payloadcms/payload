'use client'

import { RadioGroupField, useTheme, useTranslation } from '@payloadcms/ui/client'
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
      label={t('general:adminTheme')}
      name="theme"
      onChange={onChange}
      options={[
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
      ]}
      value={autoMode ? 'auto' : theme}
    />
  )
}
