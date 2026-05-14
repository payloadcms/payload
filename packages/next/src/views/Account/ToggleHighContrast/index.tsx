'use client'

import { CheckboxInput, useTheme, useTranslation } from '@payloadcms/ui'
import React, { useCallback } from 'react'

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
