'use client'

import React from 'react'

import { CheckboxInput } from '../../fields/Checkbox/Input.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
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
      className={[baseClass, `${baseClass}__checkbox`].join(' ')}
      id="select-all"
      name="select-all"
      onToggle={() => toggleAll()}
      partialChecked={selectAll === SelectAllStatus.Some}
    />
  )
}
