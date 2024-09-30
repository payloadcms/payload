'use client'
import { ReactSelect, useLocale, useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { Props } from './types.js'

import './index.scss'

const baseClass = 'select-version-locales'

export const SelectLocales: React.FC<Props> = ({ onChange, options, value }) => {
  const { t } = useTranslation()
  const { code } = useLocale()

  const format = (items) => {
    return items.map((item) => {
      if (typeof item.label === 'string') {
        return item
      }
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
      <div className={`${baseClass}__label`}>{t('version:showLocales')}</div>
      <ReactSelect
        isMulti
        onChange={onChange}
        options={format(options)}
        placeholder={t('version:selectLocales')}
        value={format(value)}
      />
    </div>
  )
}
