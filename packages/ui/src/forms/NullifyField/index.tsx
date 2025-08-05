'use client'

import * as React from 'react'

import { Banner } from '../../elements/Banner/index.js'
import { CheckboxField } from '../../fields/Checkbox/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { useForm } from '../Form/context.js'
import './index.scss'

const baseClass = 'nullify-locale-field'

type NullifyLocaleFieldProps = {
  readonly fieldValue?: [] | null | number
  readonly localized: boolean
  readonly path: string
  readonly readOnly?: boolean
}

export const NullifyLocaleField: React.FC<NullifyLocaleFieldProps> = ({
  fieldValue,
  localized,
  path,
  readOnly = false,
}) => {
  const { code: currentLocale } = useLocale()
  const {
    config: { localization },
  } = useConfig()
  const [checked, setChecked] = React.useState<boolean>(typeof fieldValue !== 'number')
  const { t } = useTranslation()
  const { dispatchFields, setModified } = useForm()

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
    <Banner className={baseClass}>
      {!fieldValue && readOnly ? (
        t('general:fallbackToDefaultLocale')
      ) : (
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
      )}
    </Banner>
  )
}
