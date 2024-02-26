import React from 'react'

import SearchIcon from '../../../../../graphics/Search'
import { useTranslation } from '../../../../../providers/Translation'
import './index.scss'

const baseClass = 'block-search'

const BlockSearch: React.FC<{ setSearchTerm: (term: string) => void }> = (props) => {
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
      <SearchIcon />
    </div>
  )
}

export default BlockSearch
