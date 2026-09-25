'use client'
import React, { useState } from 'react'

import { SearchInput } from '../../../../elements/Search/SearchInput/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'block-search'

export const BlockSearch: React.FC<{ setSearchTerm: (term: string) => void }> = (props) => {
  const { setSearchTerm } = props
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  const handleChange = (search: string) => {
    setValue(search)
    setSearchTerm(search)
  }

  return (
    <div className={baseClass}>
      <SearchInput
        aria-label={t('fields:searchForBlock')}
        className={`${baseClass}__input`}
        onChange={handleChange}
        onClear={() => handleChange('')}
        placeholder={t('fields:searchForBlock')}
        value={value}
      />
    </div>
  )
}
