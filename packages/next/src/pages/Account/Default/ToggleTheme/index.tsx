'use client'
import React, { useCallback } from 'react'
import { useTranslation } from '../../../providers/Translation'

import type { OnChange, Theme } from '@payloadcms/ui'
import { useTheme, RadioGroupInput } from '@payloadcms/ui'

export const ToggleTheme: React.FC = () => {
  const {
    //  autoMode,
    setTheme,
    theme,
  } = useTheme()
  const { t } = useTranslation()

  const onChange = useCallback<OnChange<Theme>>(
    (newTheme) => {
      setTheme(newTheme)
    },
    [setTheme],
  )

  return (
    <RadioGroupInput
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
      // value={autoMode ? 'auto' : theme}
      value={theme}
    />
  )
}
