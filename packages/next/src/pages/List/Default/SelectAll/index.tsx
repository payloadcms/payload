'use client'
import { CheckboxInput, SelectAllStatus, useSelection, useTranslation } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

const baseClass = 'select-all'

const SelectAll: React.FC = () => {
  const { selectAll, toggleAll } = useSelection()
  const { i18n } = useTranslation()

  return (
    <CheckboxInput
      aria-label={
        selectAll === SelectAllStatus.None
          ? i18n.t('general:selectAllRows')
          : i18n.t('general:deselectAllRows')
      }
      checked={
        selectAll === SelectAllStatus.AllInPage || selectAll === SelectAllStatus.AllAvailable
      }
      className={`${baseClass}__checkbox`}
      id="select-all"
      onChange={() => toggleAll()}
      partialChecked={selectAll === SelectAllStatus.Some}
      path="select-all"
    />
  )
}

export default SelectAll
