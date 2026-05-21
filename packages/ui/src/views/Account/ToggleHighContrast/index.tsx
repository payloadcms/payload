'use client'

import React, { useCallback } from 'react'

import { CheckboxInput } from '../../../fields/Checkbox/Input.js'
import { useTheme } from '../../../providers/Theme/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export const ToggleHighContrast: React.FC = () => {
  const { highContrastMode, setHighContrastMode } = useTheme()
  const { t } = useTranslation()

  const onToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setHighContrastMode(event.target.checked)
    },
    [setHighContrastMode],
  )

  return (
    <CheckboxInput
      checked={highContrastMode}
      id="field-highContrastMode"
      label={t('general:enhancedContrastMode')}
      name="highContrastMode"
      onToggle={onToggle}
    />
  )
}
