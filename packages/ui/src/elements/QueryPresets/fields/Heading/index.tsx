'use client'
import type { ClientTranslationKeys } from '@payloadcms/translations'

import React from 'react'

import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.css'

export const QueryPresetsHeading: React.FC<{ i18nKey?: ClientTranslationKeys }> = ({
  i18nKey = 'general:presets',
}) => {
  const { t } = useTranslation()

  return <h3 className="query-preset-heading">{t(i18nKey)}</h3>
}
