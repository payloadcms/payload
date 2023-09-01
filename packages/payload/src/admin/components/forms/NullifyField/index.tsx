import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Banner } from '../../elements/Banner'
import { useConfig } from '../../utilities/Config'
import { useLocale } from '../../utilities/Locale'
import { useForm } from '../Form/context'
import { CheckboxInput } from '../field-types/Checkbox/Input'

type NullifyLocaleFieldProps = {
  fieldValue?: [] | null | number
  localized: boolean
  path: string
}
export const NullifyLocaleField: React.FC<NullifyLocaleFieldProps> = ({
  fieldValue,
  localized,
  path,
}) => {
  const { dispatchFields, setModified } = useForm()
  const { code: currentLocale } = useLocale()
  const { localization } = useConfig()
  const [checked, setChecked] = React.useState<boolean>(typeof fieldValue !== 'number')
  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'
  const { t } = useTranslation('general')

  const onChange = () => {
    const useFallback = !checked

    dispatchFields({
      path,
      type: 'UPDATE',
      value: useFallback ? null : fieldValue || 0,
    })
    setModified(true)
    setChecked(useFallback)
  }

  if (!localized || currentLocale === defaultLocale || (localization && !localization.fallback)) {
    // hide when field is not localized or editing default locale or when fallback is disabled
    return null
  }

  if (fieldValue) {
    let hideCheckbox = false
    if (typeof fieldValue === 'number' && fieldValue > 0) hideCheckbox = true
    if (Array.isArray(fieldValue) && fieldValue.length > 0) hideCheckbox = true

    if (hideCheckbox) {
      if (checked) setChecked(false) // uncheck when field has value
      return null
    }
  }

  return (
    <Banner>
      <CheckboxInput
        checked={checked}
        id={`field-${path.replace(/\./g, '__')}`}
        label={t('fallbackToDefaultLocale')}
        onToggle={onChange}
      />
    </Banner>
  )
}
