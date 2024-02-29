'use client'

import React from 'react'

import { CheckboxInput, SelectAllStatus, useSelection, useTranslation } from '../..'
import './index.scss'

const baseClass = 'select-all'

export const SelectAll: React.FC = () => {
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
      name="select-all"
      onToggle={() => toggleAll()}
      partialChecked={selectAll === SelectAllStatus.Some}
    />
  )
}
