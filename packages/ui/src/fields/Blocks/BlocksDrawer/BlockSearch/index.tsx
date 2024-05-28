'use client'
import React from 'react'

import { Search } from '../../../../graphics/Search/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'block-search'

export const BlockSearch: React.FC<{ setSearchTerm: (term: string) => void }> = (props) => {
  const { setSearchTerm } = props
  const { t } = useTranslation()

  const handleChange = (e) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className={baseClass}>
      <input
        className={`${baseClass}__input`}
        onChange={handleChange}
        placeholder={t('fields:searchForBlock')}
      />
      <Search />
    </div>
  )
}
