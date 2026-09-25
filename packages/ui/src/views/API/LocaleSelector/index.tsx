'use client'
import React from 'react'

import { SelectField } from '../../../fields/Select/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export const LocaleSelector: React.FC<{
  readonly localeOptions: {
    label: Record<string, string> | string
    value: string
  }[]
  readonly onChange: (value: string) => void
}> = ({ localeOptions, onChange }) => {
  const { t } = useTranslation()

  return (
    <SelectField
      field={{
        name: 'locale',
        label: t('general:locale'),
        options: localeOptions,
      }}
      onChange={(value: string) => onChange(value)}
      path="locale"
    />
  )
}
