'use client'
import React, { Fragment, createContext, useContext, useState } from 'react'
import { useTranslation } from '../../providers/Translation'

import type { Context as ContextType } from './types'

import IconGraphic from '../../graphics/Icon'
import { getTranslation } from '@payloadcms/translations'
import { useConfig } from '../../providers/Config'
import './index.scss'

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
  className?: string
  Link?: React.ComponentType
}> = ({ Link, className }) => {
  const { i18n } = useTranslation()

  const { stepNav } = useStepNav()

  const config = useConfig()

  const {
    routes: { admin },
  } = config

  const LinkElement = Link || 'a'

  return (
    <Fragment>
      {stepNav.length > 0 ? (
        <nav className={[baseClass, className].filter(Boolean).join(' ')}>
          <LinkElement
            className={`${baseClass}__home`}
            tabIndex={0}
            // to={admin} // for `react-router-dom`
            href={admin} // for `next/link`
          >
            <IconGraphic />
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
                  <LinkElement
                    // to={item.url} // for `react-router-dom`
                    href={item.url} // for `next/link`
                  >
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
          <IconGraphic />
        </div>
      )}
    </Fragment>
  )
}

export { StepNavProvider, useStepNav }

export default StepNav
