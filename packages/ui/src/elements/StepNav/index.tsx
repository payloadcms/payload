'use client'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment } from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { StepNavProvider, useStepNav } from './context.js'
import './index.scss'
export { SetStepNav } from './SetStepNav.js'
import type { StepNavItem } from './types.js'

import { RenderComponent } from '../../providers/Config/RenderComponent.js'

const baseClass = 'step-nav'

const StepNav: React.FC<{
  Link?: React.ComponentType
  className?: string
}> = ({ Link, className }) => {
  const { i18n } = useTranslation()

  const { stepNav } = useStepNav()

  const {
    config: {
      routes: { admin },
      admin: {
        components: {
          graphics: { Icon },
        },
      },
    },
  } = useConfig()

  const { t } = useTranslation()

  const LinkElement = Link || 'a'

  return (
    <Fragment>
      {stepNav.length > 0 ? (
        <nav className={[baseClass, className].filter(Boolean).join(' ')}>
          <LinkElement className={`${baseClass}__home`} href={admin} tabIndex={0}>
            <span title={t('general:dashboard')}>
              <RenderComponent mappedComponent={Icon} />
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
                  <LinkElement href={item.url}>
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
              <RenderComponent mappedComponent={Icon} />
            </span>
          </div>
        </div>
      )}
    </Fragment>
  )
}

export { StepNav, StepNavItem, StepNavProvider, useStepNav }
