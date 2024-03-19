'use client'
import type { OnChange } from '@payloadcms/ui/forms'
import type { Theme } from '@payloadcms/ui/providers'

import { RadioGroupInput } from '@payloadcms/ui/forms'
import { useTheme, useTranslation } from '@payloadcms/ui/providers'
import React, { useCallback } from 'react'

export const ToggleTheme: React.FC = () => {
  const { autoMode, setTheme, theme } = useTheme()
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
      value={autoMode ? 'auto' : theme}
    />
  )
}
