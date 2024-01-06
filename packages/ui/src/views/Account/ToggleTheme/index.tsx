'use client'
import React, { useCallback } from 'react'
import { useTranslation } from '../../../providers/Translation'

import type { OnChange } from '../../../forms/field-types/RadioGroup/types'
import type { Theme } from '../../../providers/Theme/types'

import RadioGroupInput from '../../../forms/field-types/RadioGroup/Input'
import { useTheme } from '../../../providers/Theme'

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
