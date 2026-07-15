'use client'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment } from 'react'

import type { StepNavItem } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { StepNavProvider, useStepNav } from './context.js'
import './index.css'

export { SetStepNav } from './SetStepNav.js'

const baseClass = 'step-nav'

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

  return (
    <nav className={[baseClass, className].filter(Boolean).join(' ')}>
      {stepNavItems.map((item, i) => {
        const StepLabel = getTranslation(item.label, i18n)
        const isLast = stepNavItems.length === i + 1
        const isFirst = i === 0

        return (
          <Fragment key={i}>
            {item.url ? (
              <Button
                buttonStyle="ghost"
                className={[
                  `${baseClass}__item`,
                  isLast ? `${baseClass}__last` : undefined,
                  isFirst ? `${baseClass}__first` : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                el="link"
                url={item.url}
              >
                {StepLabel}
              </Button>
            ) : (
              <span
                className={[
                  `${baseClass}__item`,
                  isLast ? `${baseClass}__last` : undefined,
                  isFirst ? `${baseClass}__first` : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {StepLabel}
              </span>
            )}
            {!isLast && <span className={`${baseClass}__separator`}>/</span>}
          </Fragment>
        )
      })}
    </nav>
  )
}

export { StepNav, StepNavItem, StepNavProvider, useStepNav }
