'use client'
import { useDocumentLockStatus } from '@payloadcms/ui'
import React from 'react'

import { useTableCell } from '../../elements/Table/TableCellProvider/index.js'
import { CheckboxInput } from '../../fields/Checkbox/Input.js'
import { LockIcon } from '../../icons/Lock/index.js'
import { useSelection } from '../../providers/Selection/index.js'
import './index.scss'

const baseClass = 'select-row'

export const SelectRow: React.FC = () => {
  const { selected, setSelection } = useSelection()
  const { rowData } = useTableCell()
  const isLocked = useDocumentLockStatus(rowData?.id)

  if (isLocked) {
    return <LockIcon />
  }

  return (
    <CheckboxInput
      checked={selected?.[rowData?.id]}
      className={[baseClass, `${baseClass}__checkbox`].join(' ')}
      onToggle={() => setSelection(rowData.id)}
    />
  )
}
