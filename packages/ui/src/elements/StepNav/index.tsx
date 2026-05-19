'use client'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment } from 'react'

import type { StepNavItem } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Link } from '../Link/index.js'
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

  // Filter out any stepNav items that point to the dashboard (admin route)
  // since Dashboard is shown as the home element (unless there's a dashboard dropdown)
  const filteredStepNav = hasDashboardDropdown
    ? stepNav
    : stepNav.filter((item) => item.url !== admin)

  return (
    <Fragment>
      {filteredStepNav.length > 0 ? (
        <nav className={[baseClass, className].filter(Boolean).join(' ')}>
          {!hasDashboardDropdown && (
            <>
              <Link className={`${baseClass}__home`} href={admin} prefetch={false} tabIndex={0}>
                <span className={`${baseClass}__home-label`}>{t('general:dashboard')}</span>
              </Link>
              <span className={`${baseClass}__separator`}>/</span>
            </>
          )}
          {filteredStepNav.map((item, i) => {
            const StepLabel = getTranslation(item.label, i18n)
            const isLast = filteredStepNav.length === i + 1

            const Step = isLast ? (
              item.url ? (
                <Link forceReload={item.forceReload} href={item.url} key={i} prefetch={false}>
                  <span className={`${baseClass}__last`}>{StepLabel}</span>
                </Link>
              ) : (
                <span className={`${baseClass}__last`} key={i}>
                  {StepLabel}
                </span>
              )
            ) : (
              <Fragment key={i}>
                {item.url ? (
                  <Link forceReload={item.forceReload} href={item.url} prefetch={false}>
                    <span key={i}>{StepLabel}</span>
                  </Link>
                ) : (
                  <span key={i}>{StepLabel}</span>
                )}
                <span className={`${baseClass}__separator`}>/</span>
              </Fragment>
            )

            return Step
          })}
        </nav>
      ) : (
        <div className={[baseClass, className].filter(Boolean).join(' ')}>
          <div className={`${baseClass}__home`}>
            <span className={`${baseClass}__home-label`}>{t('general:dashboard')}</span>
          </div>
        </div>
      )}
    </Fragment>
  )
}

export { StepNav, StepNavItem, StepNavProvider, useStepNav }
