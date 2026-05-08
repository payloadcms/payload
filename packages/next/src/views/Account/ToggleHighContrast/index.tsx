'use client'

import { CheckboxInput, useHighContrast, useTranslation } from '@payloadcms/ui'
import React, { useCallback } from 'react'

export const ToggleHighContrast: React.FC = () => {
  const { highContrastMode, setHighContrastMode } = useHighContrast()
  const { t } = useTranslation()

  const onToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setHighContrastMode(event.target.checked ? 'on' : 'off')
    },
    [setHighContrastMode],
  )

  return (
    <CheckboxInput
      checked={highContrastMode === 'on'}
      id="field-highContrastMode"
      label={t('general:enhancedContrastMode')}
      name="highContrastMode"
      onToggle={onToggle}
    />
  )
}
