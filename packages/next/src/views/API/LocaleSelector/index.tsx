import { SelectField, useTranslation } from '@payloadcms/ui/client'
import React from 'react'

export const LocaleSelector: React.FC<{
  localeOptions: {
    label: Record<string, string> | string
    value: string
  }[]
  onChange: (value: string) => void
}> = ({ localeOptions, onChange }) => {
  const { t } = useTranslation()

  return (
    <SelectField
      label={t('general:locale')}
      name="locale"
      onChange={(value: string) => onChange(value)}
      options={localeOptions}
      path="locale"
    />
  )
}
