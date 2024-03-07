'use client'
import React, { useState } from 'react'
import AnimateHeightWithDefault from 'react-animate-height'

// @ts-expect-error trust me it works
const AnimateHeight = AnimateHeightWithDefault || AnimateHeightWithDefault.default

import type { Props } from './types.d.ts'

import { Chevron } from '../../icons/Chevron/index.js'
import { DragHandle } from '../../icons/DragHandle/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'
import { CollapsibleProvider, useCollapsible } from './provider.js'

const baseClass = 'collapsible'

export const Collapsible: React.FC<Props> = ({
  actions,
  children,
  className,
  collapsed: collapsedFromProps,
  collapsibleStyle = 'default',
  dragHandleProps,
  header,
  initCollapsed,
  onToggle,
}) => {
  const [collapsedLocal, setCollapsedLocal] = useState(Boolean(initCollapsed))
  const [hoveringToggle, setHoveringToggle] = useState(false)
  const { withinCollapsible } = useCollapsible()
  const { t } = useTranslation()

  const collapsed = typeof collapsedFromProps === 'boolean' ? collapsedFromProps : collapsedLocal

  const toggleCollapsible = React.useCallback(() => {
    if (typeof onToggle === 'function') onToggle(!collapsed)
    setCollapsedLocal(!collapsed)
  }, [onToggle, collapsed])

  return (
    <div
      className={[
        baseClass,
        className,
        dragHandleProps && `${baseClass}--has-drag-handle`,
        collapsed && `${baseClass}--collapsed`,
        withinCollapsible && `${baseClass}--nested`,
        hoveringToggle && `${baseClass}--hovered`,
        `${baseClass}--style-${collapsibleStyle}`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <CollapsibleProvider collapsed={collapsed} toggle={toggleCollapsible}>
        <div
          className={`${baseClass}__toggle-wrap`}
          onMouseEnter={() => setHoveringToggle(true)}
          onMouseLeave={() => setHoveringToggle(false)}
        >
          {dragHandleProps && (
            <div
              className={`${baseClass}__drag`}
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
            >
              <DragHandle />
            </div>
          )}
          <button
            className={[
              `${baseClass}__toggle`,
              `${baseClass}__toggle--${collapsed ? 'collapsed' : 'open'}`,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={toggleCollapsible}
            type="button"
          >
            <span>{t('fields:toggleBlock')}</span>
          </button>
          {header && (
            <div
              className={[
                `${baseClass}__header-wrap`,
                dragHandleProps && `${baseClass}__header-wrap--has-drag-handle`,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {header && header}
            </div>
          )}
          <div className={`${baseClass}__actions-wrap`}>
            {actions && <div className={`${baseClass}__actions`}>{actions}</div>}
            <div className={`${baseClass}__indicator`}>
              <Chevron direction={!collapsed ? 'up' : undefined} />
            </div>
          </div>
        </div>
        <AnimateHeight duration={200} height={collapsed ? 0 : 'auto'}>
          <div className={`${baseClass}__content`}>{children}</div>
        </AnimateHeight>
      </CollapsibleProvider>
    </div>
  )
}
