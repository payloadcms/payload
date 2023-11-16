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
        options={options}
        placeholder={t('selectLocales')}
        value={value}
      />
    </div>
  )
}

export default SelectLocales
