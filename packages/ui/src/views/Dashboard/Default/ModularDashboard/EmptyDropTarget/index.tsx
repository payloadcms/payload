'use client'

import { useDroppable } from '@dnd-kit/core'
import { useMemo } from 'react'

import { useTranslation } from '../../../../../providers/Translation/index.js'
import { EMPTY_DASHBOARD_DROP_ID } from '../utils/getDrawerWidgetDrop.js'
import './index.css'

export function EmptyDropTarget() {
  const { t } = useTranslation()
  const droppableArgs = useMemo(
    () => ({ id: EMPTY_DASHBOARD_DROP_ID, data: { position: 'empty' } }),
    [],
  )
  const { isOver, setNodeRef } = useDroppable(droppableArgs)

  return (
    <div
      className={`modular-dashboard__empty dashboard-empty-drop${isOver ? ' dashboard-empty-drop--active' : ''}`}
      data-drop-index={0}
      data-testid={EMPTY_DASHBOARD_DROP_ID}
      ref={setNodeRef}
    >
      {t('dashboard:noItems')}
    </div>
  )
}
