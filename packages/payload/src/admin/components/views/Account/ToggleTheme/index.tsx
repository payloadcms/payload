import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { OnChange } from '../../../forms/field-types/RadioGroup/types'
import type { Theme } from '../../../utilities/Theme'

import RadioGroupInput from '../../../forms/field-types/RadioGroup/Input'
import { useTheme } from '../../../utilities/Theme'

export const ToggleTheme: React.FC = () => {
  const { autoMode, setTheme, theme } = useTheme()
  const { t } = useTranslation('general')

  const onChange = useCallback<OnChange<Theme>>(
    (newTheme) => {
      setTheme(newTheme)
    },
    [setTheme],
  )

  return (
    <RadioGroupInput
      label={t('adminTheme')}
      name="theme"
      onChange={onChange}
      options={[
        {
          label: t('automatic'),
          value: 'auto',
        },
        {
          label: t('light'),
          value: 'light',
        },
        {
          label: t('dark'),
          value: 'dark',
        },
      ]}
      value={autoMode ? 'auto' : theme}
    />
  )
}
