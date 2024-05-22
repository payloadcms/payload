import { Select } from '@payloadcms/ui/fields/Select'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React, { useEffect, useState } from 'react'

export const LocaleSelector: React.FC<{
  localeOptions: {
    label: Record<string, string> | string
    value: string
  }[]
  onChange: (value: string) => void
}> = ({ localeOptions, onChange }) => {
  const { t } = useTranslation()

  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return (
    <Select
      label={t('general:locale')}
      name="locale"
      onChange={(value) => onChange(value)}
      options={localeOptions}
      path="locale"
    />
  )
}
