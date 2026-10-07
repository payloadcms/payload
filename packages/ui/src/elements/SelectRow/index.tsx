'use client'
import type { User } from 'payload'

import React, { use } from 'react'

import { CheckboxInput } from '../../fields/Checkbox/Input.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Locked } from '../Locked/index.js'
import { TableGridContext } from '../Table/TableIdentity.js'
import './index.css'

const baseClass = 'select-row'

export const SelectRow: React.FC<{
  rowData: {
    _isLocked?: boolean
    _userEditing?: User
    id: number | string
  }
  rowIndex?: number
  selectRowLabel: string
}> = ({ rowData, rowIndex, selectRowLabel }) => {
  const isGrid = use(TableGridContext)
  const { t } = useTranslation()
  const { user } = useAuth()
  const { selected, setSelection } = useSelection()
  const { _isLocked, _userEditing } = rowData || {}

  const documentIsLocked = _isLocked && _userEditing

  if (documentIsLocked && _userEditing.id !== user?.id) {
    return <Locked user={_userEditing} />
  }

  return (
    <CheckboxInput
      aria-label={
        isGrid && rowIndex !== undefined
          ? `${selectRowLabel}, ${t('general:row')} ${rowIndex + 1}`
          : selectRowLabel
      }
      checked={Boolean(selected.get(rowData.id))}
      className={[baseClass, `${baseClass}__checkbox`].join(' ')}
      onToggle={() => setSelection(rowData.id)}
      variant="muted"
    />
  )
}
