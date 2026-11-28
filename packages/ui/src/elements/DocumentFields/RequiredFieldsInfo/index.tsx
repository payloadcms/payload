'use client'

import React from 'react'

import { InfoIcon } from '../../../icons/Info/index.js'
import { useAccessibility } from '../../../providers/Accessibility/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

export const RequiredFieldsInfo = () => {
  const { shouldShowHelpTooltips } = useAccessibility()
  const { t } = useTranslation()

  if (!shouldShowHelpTooltips) {
    return null
  }

  return (
    <p className="required-fields-info">
      <span aria-hidden="true" className="required-fields-info__icon">
        <InfoIcon />
      </span>
      <span>{t('general:requiredFields')}</span>
    </p>
  )
}
