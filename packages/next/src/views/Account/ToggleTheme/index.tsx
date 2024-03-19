'use client'

import { RadioGroup } from '@payloadcms/ui/fields/RadioGroup'
import { useTheme } from '@payloadcms/ui/providers/Theme'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
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
    <RadioGroup
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
