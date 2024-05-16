'use client'
import type { LabelFunction } from 'payload/config'

import { getTranslation } from '@payloadcms/translations'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import React, { Fragment, createContext, useContext, useState } from 'react'

import { PayloadIcon } from '../../graphics/Icon/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

export { SetStepNav } from './SetStepNav.js'

export type StepNavItem = {
  label: LabelFunction | Record<string, string> | string
  url?: string
}

export type ContextType = {
  setStepNav: (items: StepNavItem[]) => void
  stepNav: StepNavItem[]
}

const baseClass = 'step-nav'

const Context = createContext({} as ContextType)

const StepNavProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [stepNav, setStepNav] = useState([])

  return (
    <Context.Provider
      value={{
        setStepNav,
        stepNav,
      }}
    >
      {children}
    </Context.Provider>
  )
}

const useStepNav = (): ContextType => useContext(Context)

const StepNav: React.FC<{
  Link?: React.ComponentType
  className?: string
}> = ({ Link, className }) => {
  const { i18n } = useTranslation()

  const { stepNav } = useStepNav()

  const config = useConfig()

  const {
    routes: { admin },
  } = config

  const { componentMap } = useComponentMap()

  const { t } = useTranslation()

  const Icon = componentMap?.Icon || <PayloadIcon />

  const LinkElement = Link || 'a'

  return (
    <Fragment>
      {stepNav.length > 0 ? (
        <nav className={[baseClass, className].filter(Boolean).join(' ')}>
          <LinkElement className={`${baseClass}__home`} href={admin} tabIndex={0}>
            <span title={t('general:dashboard')}>{Icon}</span>
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
            <span title={t('general:dashboard')}>{Icon}</span>
          </div>
        </div>
      )}
    </Fragment>
  )
}

export { StepNav, StepNavProvider, useStepNav }
