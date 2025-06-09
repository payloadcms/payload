'use client'

import { fieldBaseClass, ReactSelect, useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { Props } from './types.js'

import './index.scss'

const baseClass = 'compare-version'

export const SelectComparison: React.FC<Props> = (props) => {
  const { onChange, versionFromID, versionFromOptions } = props
  const { t } = useTranslation()

  const currentOption = React.useMemo(
    () => versionFromOptions.find((option) => option.value === versionFromID),
    [versionFromOptions, versionFromID],
  )

  return (
    <div className={[fieldBaseClass, baseClass].filter(Boolean).join(' ')}>
      <ReactSelect
        isClearable={false}
        isSearchable={false}
        onChange={onChange}
        options={versionFromOptions}
        placeholder={t('version:selectVersionToCompare')}
        value={currentOption}
      />
    </div>
  )
}
