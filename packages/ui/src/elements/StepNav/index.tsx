'use client'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useEffect, useRef, useState } from 'react'

import type { StepNavItem } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import { StepNavProvider, useStepNav } from './context.js'
import './index.css'

export { SetStepNav } from './SetStepNav.js'

const baseClass = 'step-nav'

/**
 * Minimum number of breadcrumbs required before the middle items become
 * eligible to collapse into a "…" popup. Below this we always render inline
 * and let the last item ellipsize instead.
 */
const minItemsToCollapse = 4

const StepNav: React.FC<{
  readonly className?: string
}> = ({ className }) => {
  const { i18n } = useTranslation()

  const { stepNav } = useStepNav()

  const {
    config: {
      routes: { admin },
    },
  } = useConfig()

  const { t } = useTranslation()

  const navRef = useRef<HTMLElement>(null)
  const measurerRef = useRef<HTMLDivElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Check if first item is a dashboard dropdown (React element with no URL)
  // In that case, it replaces the home element entirely
  const firstItem = stepNav[0]
  const hasDashboardDropdown =
    firstItem &&
    !firstItem.url &&
    typeof firstItem.label !== 'string' &&
    React.isValidElement(firstItem.label)

  const stepNavItems = hasDashboardDropdown
    ? stepNav
    : [
        {
          label: t('general:dashboard'),
          url: admin,
        },
        ...stepNav,
      ]

  const canCollapse = !hasDashboardDropdown && stepNavItems.length >= minItemsToCollapse

  // Only collapse when the fully expanded breadcrumbs can't fit the available
  // width. A hidden measurer renders the always-expanded version so we can
  // compare its natural width against the space the nav actually has, without
  // the measurement feeding back into the collapsed state.
  useEffect(() => {
    if (!canCollapse) {
      setIsCollapsed(false)
      return
    }

    const nav = navRef.current
    const measurer = measurerRef.current
    const container = nav?.parentElement

    if (!nav || !measurer || !container) {
      return
    }

    const measure = () => {
      const available = container.clientWidth
      const needed = measurer.getBoundingClientRect().width
      setIsCollapsed(needed - available > 1)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(container)

    return () => observer.disconnect()
  }, [canCollapse, stepNav, i18n, admin, t])

  const renderItem = (
    item: StepNavItem,
    { isFirst, isLast }: { isFirst: boolean; isLast: boolean },
  ) => {
    const StepLabel = getTranslation(item.label, i18n)
    const itemClassName = [
      `${baseClass}__item`,
      isLast ? `${baseClass}__last` : undefined,
      isFirst ? `${baseClass}__first` : undefined,
    ]
      .filter(Boolean)
      .join(' ')

    if (item.url) {
      return (
        <Button buttonStyle="ghost" className={itemClassName} el="link" url={item.url}>
          {StepLabel}
        </Button>
      )
    }

    return <span className={itemClassName}>{StepLabel}</span>
  }

  const separator = <span className={`${baseClass}__separator`}>/</span>

  const shouldCollapse = canCollapse && isCollapsed
  const collapsedItems = shouldCollapse ? stepNavItems.slice(1, -1) : []
  const lastItem = stepNavItems[stepNavItems.length - 1]

  return (
    <Fragment>
      <nav className={[baseClass, className].filter(Boolean).join(' ')} ref={navRef}>
        {shouldCollapse ? (
          <Fragment>
            {renderItem(stepNavItems[0], { isFirst: true, isLast: false })}
            {separator}
            <Popup
              button="…"
              buttonAriaLabel={t('general:moreOptions')}
              buttonClassName={`${baseClass}__collapsed-toggle`}
              buttonType="custom"
              className={`${baseClass}__collapsed`}
              horizontalAlign="left"
              noBackground
              render={({ close }) => (
                <PopupList.ButtonGroup className={`${baseClass}__collapsed-list`}>
                  {collapsedItems.map((item, i) => (
                    <PopupList.Button href={item.url} key={i} onClick={close}>
                      <span
                        className={`${baseClass}__collapsed-item-label`}
                        style={{ paddingInlineStart: `calc(var(--spacer-2) * ${i})` }}
                      >
                        {getTranslation(item.label, i18n)}
                      </span>
                    </PopupList.Button>
                  ))}
                </PopupList.ButtonGroup>
              )}
              size="fit-content"
              verticalAlign="bottom"
            />
            {separator}
            {renderItem(lastItem, { isFirst: false, isLast: true })}
          </Fragment>
        ) : (
          stepNavItems.map((item, i) => {
            const isLast = stepNavItems.length === i + 1
            const isFirst = i === 0

            return (
              <Fragment key={i}>
                {renderItem(item, { isFirst, isLast })}
                {!isLast && separator}
              </Fragment>
            )
          })
        )}
      </nav>
      {canCollapse ? (
        <span aria-hidden="true" className={`${baseClass}__measurer-clip`} inert>
          <div className={`${baseClass}__measurer`} ref={measurerRef}>
            {stepNavItems.map((item, i) => {
              const isLast = stepNavItems.length === i + 1
              const isFirst = i === 0

              return (
                <Fragment key={i}>
                  {renderItem(item, { isFirst, isLast })}
                  {!isLast && separator}
                </Fragment>
              )
            })}
          </div>
        </span>
      ) : null}
    </Fragment>
  )
}

export { StepNav, StepNavItem, StepNavProvider, useStepNav }
