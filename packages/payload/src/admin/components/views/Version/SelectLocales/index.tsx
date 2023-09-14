import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import ReactSelect from '../../../elements/ReactSelect'
import './index.scss'

const baseClass = 'select-version-locales'

const SelectLocales: React.FC<Props> = ({ onChange, options, value }) => {
  const { t } = useTranslation('version')

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__label`}>{t('showLocales')}</div>
      <ReactSelect
        isMulti
        onChange={onChange}
        options={options.map(({ code }) => ({ label: code, value: code }))}
        placeholder={t('selectLocales')}
        value={value.map(({ code }) => ({ label: code, value: code }))}
      />
    </div>
  )
}

export default SelectLocales
