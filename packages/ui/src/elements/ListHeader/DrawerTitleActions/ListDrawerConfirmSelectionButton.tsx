'use client'

import React, { useCallback } from 'react'

import { useSelection } from '../../../providers/Selection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useListDrawerContext } from '../../ListDrawer/Provider.js'

/** Applies the current picker selection and stays disabled until a document is selected. */
export function ListDrawerConfirmSelectionButton({
  enableRowSelections,
}: {
  enableRowSelections?: boolean
}) {
  const { count, selected } = useSelection()
  const { onBulkSelect } = useListDrawerContext()
  const { t } = useTranslation()

  const handleConfirm = useCallback(() => {
    onBulkSelect?.(selected)
  }, [onBulkSelect, selected])

  if (!enableRowSelections || typeof onBulkSelect !== 'function') {
    return null
  }

  return (
    <Button
      buttonStyle="primary"
      disabled={count === 0}
      margin={false}
      onClick={handleConfirm}
      size="medium"
    >
      {t('general:confirm')}
    </Button>
  )
}
