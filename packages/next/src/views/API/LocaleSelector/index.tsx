import { Select } from '@payloadcms/ui/fields/Select'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
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
    <Select
      label={t('general:locale')}
      name="locale"
      onChange={(value: string) => onChange(value)}
      options={localeOptions}
      path="locale"
    />
  )
}
