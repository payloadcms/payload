'use client'
import React, { useId, useState } from 'react'

import type { DragHandleProps } from '../DraggableSortable/DraggableSortableItem/types.js'

import { AlignJustifiedIcon } from '../../icons/AlignJustified/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'
import { AnimateHeight } from '../AnimateHeight/index.js'
import { CollapsibleProvider, useCollapsible } from './provider.js'

const baseClass = 'collapsible'

export { CollapsibleProvider, useCollapsible }

export type CollapsibleProps = {
  actions?: React.ReactNode
  /**
   * Components that will be rendered within the collapsible provider but after the wrapper.
   */
  AfterCollapsible?: React.ReactNode
  children: React.ReactNode
  className?: string
  collapsibleStyle?: 'default' | 'error'
  /**
   * If set to true, clicking on the collapsible header will not toggle the collapsible state.
   * This is useful if the collapsible state is controlled externally (e.g. from a parent component or custom button).
   */
  disableHeaderToggle?: boolean
  /**
   * If set to true, the toggle indicator (chevron) on the right side of the header will be hidden.
   */
  disableToggleIndicator?: boolean
  dragHandleProps?: DragHandleProps
  /** Opt into a region named by the rendered header for significant sections, not individual rows. */
  hasContentRegion?: boolean
  header?: React.ReactNode
  initCollapsed?: boolean
  isCollapsed?: boolean
  onToggle?: (collapsed: boolean) => Promise<void> | void
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  actions,
  AfterCollapsible,
  children,
  className,
  collapsibleStyle = 'default',
  disableHeaderToggle = false,
  disableToggleIndicator = false,
  dragHandleProps,
  hasContentRegion = false,
  header,
  initCollapsed,
  isCollapsed: collapsedFromProps,
  onToggle,
}) => {
  const id = useId()
  const dragLabelID = `${id}-drag-label`
  const headerID = `${id}-header`
  const toggleLabelID = `${id}-toggle-label`
  const contentID = `${id}-content`
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
        hoveringToggle && !disableHeaderToggle && `${baseClass}--hovered`,
        `${baseClass}--style-${collapsibleStyle}`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <CollapsibleProvider isCollapsed={isCollapsed} toggle={toggleCollapsible}>
        <div
          className={`${baseClass}__toggle-wrap${disableHeaderToggle ? ' toggle-disabled' : ''}`}
          onMouseEnter={() => setHoveringToggle(true)}
          onMouseLeave={() => setHoveringToggle(false)}
        >
          {!disableHeaderToggle && (
            <button
              aria-controls={contentID}
              aria-expanded={!isCollapsed}
              aria-labelledby={header ? `${headerID} ${toggleLabelID}` : undefined}
              className={[
                `${baseClass}__toggle`,
                `${baseClass}__toggle--${isCollapsed ? 'collapsed' : 'open'}`,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={toggleCollapsible}
              type="button"
            >
              <span id={toggleLabelID}>{t('fields:toggleBlock')}</span>
            </button>
          )}

          {dragHandleProps && (
            <button
              className={`${baseClass}__drag`}
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
              aria-labelledby={header ? `${dragLabelID} ${headerID}` : dragLabelID}
              data-sortable-id={dragHandleProps.id}
              draggable={dragHandleProps.draggable}
              ref={dragHandleProps.setActivatorNodeRef}
              type="button"
            >
              <span className="sr-only" id={dragLabelID}>
                {t('general:dragToReorder')}
              </span>
              <AlignJustifiedIcon />
            </button>
          )}
          {header ? (
            <div
              className={[
                `${baseClass}__header-wrap`,
                dragHandleProps && `${baseClass}__header-wrap--has-drag-handle`,
              ]
                .filter(Boolean)
                .join(' ')}
              id={headerID}
            >
              {header}
            </div>
          ) : null}
          <div className={`${baseClass}__actions-wrap`}>
            {actions ? <div className={`${baseClass}__actions`}>{actions}</div> : null}
            {!disableToggleIndicator && (
              <button
                aria-controls={contentID}
                aria-describedby={header ? headerID : undefined}
                aria-expanded={!isCollapsed}
                aria-label={t(isCollapsed ? 'general:expand' : 'general:collapse')}
                className={`${baseClass}__indicator`}
                onClick={toggleCollapsible}
                tabIndex={-1}
                type="button"
              >
                <ChevronIcon direction={!isCollapsed ? 'up' : undefined} />
              </button>
            )}
          </div>
        </div>
        <AnimateHeight height={isCollapsed ? 0 : 'auto'}>
          <div
            aria-labelledby={hasContentRegion && header ? headerID : undefined}
            className={`${baseClass}__content`}
            id={contentID}
            role={hasContentRegion && header ? 'region' : undefined}
          >
            {children}
          </div>
        </AnimateHeight>
        {AfterCollapsible}
      </CollapsibleProvider>
    </div>
  )
}
