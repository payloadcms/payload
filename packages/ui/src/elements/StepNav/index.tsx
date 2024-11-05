'use client'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment } from 'react'

import type { StepNavItem } from './types.js'

import { PayloadIcon } from '../../graphics/Icon/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
import { StepNavProvider, useStepNav } from './context.js'
import './index.scss'

export { SetStepNav } from './SetStepNav.js'

const baseClass = 'step-nav'

const StepNav: React.FC<{
  readonly className?: string
  readonly CustomIcon?: React.ReactNode
  readonly Link?: React.ComponentType
}> = ({ className, CustomIcon, Link }) => {
  const { i18n } = useTranslation()

  const { stepNav } = useStepNav()

  const {
    config: {
      routes: { admin },
    },
  } = useConfig()

  const { t } = useTranslation()

  const LinkElement = Link || 'a'

  const baseLinkProps = {
    prefetch: Link ? false : undefined,
  }

  return (
    <Fragment>
      {stepNav.length > 0 ? (
        <nav className={[baseClass, className].filter(Boolean).join(' ')}>
          <LinkElement
            className={`${baseClass}__home`}
            href={admin}
            tabIndex={0}
            {...baseLinkProps}
          >
            <span title={t('general:dashboard')}>
              <RenderCustomComponent CustomComponent={CustomIcon} Fallback={<PayloadIcon />} />
            </span>
          </LinkElement>
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
                  <LinkElement href={item.url} {...baseLinkProps}>
                    <span key={i}>{StepLabel}</span>
                  </LinkElement>
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
