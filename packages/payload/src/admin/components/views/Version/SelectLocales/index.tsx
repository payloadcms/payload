import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import ReactSelect from '../../../elements/ReactSelect'
import { useLocale } from '../../../utilities/Locale'
import './index.scss'

const baseClass = 'select-version-locales'

const SelectLocales: React.FC<Props> = ({ onChange, options, value }) => {
  const { t } = useTranslation('version')
  const { code } = useLocale()

  const format = (items) => {
    return items.map((item) => {
      if (typeof item.label === 'string') return item
      if (typeof item.label !== 'string' && item.label[code]) {
        return {
          label: item.label[code],
          value: item.value,
        }
      }
    })
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__label`}>{t('showLocales')}</div>
      <ReactSelect
        isMulti
        onChange={onChange}
        options={format(options)}
        placeholder={t('selectLocales')}
        value={format(value)}
      />
    </div>
  )
}

export default SelectLocales
