'use client'
import { SelectField, useTranslation } from '@payloadcms/ui'
import React from 'react'

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
