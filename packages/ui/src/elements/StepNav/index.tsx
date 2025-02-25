'use client'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment } from 'react'

import type { StepNavItem } from './types.js'

import { PayloadIcon } from '../../graphics/Icon/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Link } from '../Link/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { StepNavProvider, useStepNav } from './context.js'
import './index.scss'

export { SetStepNav } from './SetStepNav.js'

const baseClass = 'step-nav'

const StepNav: React.FC<{
  readonly className?: string
  readonly CustomIcon?: React.ReactNode
  /**
   * @deprecated
   * This prop is deprecated and will be removed in the next major version.
   * Components now import their own `Link` directly from `next/link`.
   */
  readonly Link?: React.ComponentType
}> = ({ className, CustomIcon }) => {
  const { i18n } = useTranslation()

  const { stepNav } = useStepNav()

  const {
    config: {
      routes: { admin },
    },
  } = useConfig()

  const { t } = useTranslation()

  return (
    <Fragment>
      {stepNav.length > 0 ? (
        <nav className={[baseClass, className].filter(Boolean).join(' ')}>
          <Link className={`${baseClass}__home`} href={admin} prefetch={false} tabIndex={0}>
            <span title={t('general:dashboard')}>
              <RenderCustomComponent CustomComponent={CustomIcon} Fallback={<PayloadIcon />} />
            </span>
          </Link>
          <span>/</span>
          {stepNav.map((item, i) => {
            const StepLabel = getTranslation(item.label, i18n)
            const isLast = stepNav.length === i + 1

            const Step = isLast ? (
              <span className={`${baseClass}__last`} key={i}>
                {StepLabel}
              </span>
            ) : (
              <Fragment key={i}>
                {item.url ? (
                  <Link href={item.url} prefetch={false}>
                    <span key={i}>{StepLabel}</span>
                  </Link>
                ) : (
                  <span key={i}>{StepLabel}</span>
                )}
                <span>/</span>
              </Fragment>
            )

            return Step
          })}
        </nav>
      ) : (
        <div className={[baseClass, className].filter(Boolean).join(' ')}>
          <div className={`${baseClass}__home`}>
            <span title={t('general:dashboard')}>
              <RenderCustomComponent CustomComponent={CustomIcon} Fallback={<PayloadIcon />} />
            </span>
          </div>
        </div>
      )}
    </Fragment>
  )
}

export { StepNav, StepNavItem, StepNavProvider, useStepNav }
