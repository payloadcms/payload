'use client'
import React, { useState } from 'react'

import type { DragHandleProps } from '../DraggableSortable/DraggableSortableItem/types.js'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { DragHandleIcon } from '../../icons/DragHandle/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'
import { AnimateHeight } from '../AnimateHeight/index.js'
import { CollapsibleProvider, useCollapsible } from './provider.js'

const baseClass = 'collapsible'

export { CollapsibleProvider, useCollapsible }

export type Props = {
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  collapsibleStyle?: 'default' | 'error'
  dragHandleProps?: DragHandleProps
  header?: React.ReactNode
  initCollapsed?: boolean
  isCollapsed?: boolean
  onToggle?: (collapsed: boolean) => Promise<void> | void
}

export const Collapsible: React.FC<Props> = ({
  actions,
  children,
  className,
  collapsibleStyle = 'default',
  dragHandleProps,
  header,
  initCollapsed,
  isCollapsed: collapsedFromProps,
  onToggle,
}) => {
  const [collapsedLocal, setCollapsedLocal] = useState(Boolean(initCollapsed))
  const [hoveringToggle, setHoveringToggle] = useState(false)
  const { isWithinCollapsible } = useCollapsible()
  const { t } = useTranslation()

  const isCollapsed = typeof collapsedFromProps === 'boolean' ? collapsedFromProps : collapsedLocal

  const toggleCollapsible = React.useCallback(() => {
    if (typeof onToggle === 'function') {
      void onToggle(!isCollapsed)
    }
    setCollapsedLocal(!isCollapsed)
  }, [onToggle, isCollapsed])

  return (
    <div
      className={[
        baseClass,
        className,
        dragHandleProps && `${baseClass}--has-drag-handle`,
        isCollapsed && `${baseClass}--collapsed`,
        isWithinCollapsible && `${baseClass}--nested`,
        hoveringToggle && `${baseClass}--hovered`,
        `${baseClass}--style-${collapsibleStyle}`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <CollapsibleProvider isCollapsed={isCollapsed} toggle={toggleCollapsible}>
        <div
          className={`${baseClass}__toggle-wrap`}
          onMouseEnter={() => setHoveringToggle(true)}
          onMouseLeave={() => setHoveringToggle(false)}
        >
          <button
            className={[
              `${baseClass}__toggle`,
              `${baseClass}__toggle--${isCollapsed ? 'collapsed' : 'open'}`,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={toggleCollapsible}
            type="button"
          >
            <span>{t('fields:toggleBlock')}</span>
          </button>
          {dragHandleProps && (
            <div
              className={`${baseClass}__drag`}
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
            >
              <DragHandleIcon />
            </div>
          )}
          {header ? (
            <div
              className={[
                `${baseClass}__header-wrap`,
                dragHandleProps && `${baseClass}__header-wrap--has-drag-handle`,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {header}
            </div>
          ) : null}
          <div className={`${baseClass}__actions-wrap`}>
            {actions ? <div className={`${baseClass}__actions`}>{actions}</div> : null}
            <div className={`${baseClass}__indicator`}>
              <ChevronIcon direction={!isCollapsed ? 'up' : undefined} />
            </div>
          </div>
        </div>
        <AnimateHeight height={isCollapsed ? 0 : 'auto'}>
          <div className={`${baseClass}__content`}>{children}</div>
        </AnimateHeight>
      </CollapsibleProvider>
    </div>
  )
}
