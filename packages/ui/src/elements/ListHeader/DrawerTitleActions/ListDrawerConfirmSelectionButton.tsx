'use client'

import React, { useCallback } from 'react'

import { useSelection } from '../../../providers/Selection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useListDrawerContext } from '../../ListDrawer/Provider.js'

const baseClass = 'list-header'

/**
 * Primary action of a picker drawer: applies whatever is currently selected. Always rendered so the
 * drawer has a stable primary action, and disabled until there is something to apply - the count
 * lives in the selection indicator rather than the label.
 */
export function ListDrawerConfirmSelectionButton() {
  const { count, selected } = useSelection()
  const { onBulkSelect } = useListDrawerContext()
  const { t } = useTranslation()

  const handleConfirm = useCallback(() => {
    if (typeof onBulkSelect === 'function') {
      onBulkSelect(selected)
    }
  }, [onBulkSelect, selected])

  if (typeof onBulkSelect !== 'function') {
    return null
  }

  return (
    <Button
      buttonStyle="primary"
      className={`${baseClass}__confirm-selection-button`}
      disabled={!count}
      key="confirm-selection-button"
      onClick={handleConfirm}
      size="medium"
    >
      {t('general:confirm')}
    </Button>
  )
}
