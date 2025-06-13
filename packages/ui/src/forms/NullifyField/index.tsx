'use client'

import * as React from 'react'

import { Banner } from '../../elements/Banner/index.js'
import { CheckboxField } from '../../fields/Checkbox/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useForm } from '../Form/context.js'

type NullifyLocaleFieldProps = {
  readonly fieldValue?: [] | null | number
  readonly localized: boolean
  readonly path: string
  readonly readOnly?: boolean
  readonly required: boolean
}

export const NullifyLocaleField: React.FC<NullifyLocaleFieldProps> = ({
  fieldValue,
  localized,
  path,
  readOnly = false,
  required,
}) => {
  const { code: currentLocale } = useLocale()
  const {
    config: { localization },
  } = useConfig()
  const [checked, setChecked] = React.useState<boolean>(typeof fieldValue !== 'number')
  const { t } = useTranslation()
  const { dispatchFields, setModified } = useForm()

  if (readOnly || !required) {
    // do not render when field is read-only or not required
    return null
  }

  if (!localized || !localization) {
    // hide when field is not localized or localization is not enabled
    return null
  }

  if (localization.defaultLocale === currentLocale || !localization.fallback) {
    // if editing default locale or when fallback is disabled
    return null
  }

  const onChange = () => {
    const useFallback = !checked

    dispatchFields({
      type: 'UPDATE',
      path,
      value: useFallback ? null : fieldValue || 0,
    })
    setModified(true)
    setChecked(useFallback)
  }

  if (fieldValue) {
    let hideCheckbox = false
    if (typeof fieldValue === 'number' && fieldValue > 0) {
      hideCheckbox = true
    }
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
      hideCheckbox = true
    }

    if (hideCheckbox) {
      if (checked) {
        setChecked(false)
      } // uncheck when field has value
      return null
    }
  }

  return (
    <Banner>
      <CheckboxField
        checked={checked}
        field={{
          name: '',
          label: t('general:fallbackToDefaultLocale'),
        }}
        id={`field-${path.replace(/\./g, '__')}`}
        onChange={onChange}
        path={path}
        schemaPath=""
      />
    </Banner>
  )
}
