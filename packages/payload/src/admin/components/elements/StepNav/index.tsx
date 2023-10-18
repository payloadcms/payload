import React, { Fragment, createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Context as ContextType } from './types'

import { IconGraphic } from '../../../../exports/components/graphics'
import { getTranslation } from '../../../../utilities/getTranslation'
import { useConfig } from '../../utilities/Config'
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
}> = (props) => {
  const { className } = props
  const { i18n } = useTranslation()

  const { stepNav } = useStepNav()
  const config = useConfig()
  const {
    routes: { admin },
  } = config

  return (
    <Fragment>
      {stepNav.length > 0 ? (
        <nav className={[baseClass, className].filter(Boolean).join(' ')}>
          <Link className={`${baseClass}__home`} tabIndex={0} to={admin}>
            <IconGraphic />
          </Link>
          <span>/</span>
          {stepNav.map((item, i) => {
            const StepLabel = <span key={i}>{getTranslation(item.label, i18n)}</span>
            const Step =
              stepNav.length === i + 1 ? (
                StepLabel
              ) : (
                <Fragment key={i}>
                  {item.url ? <Link to={item.url}>{StepLabel}</Link> : StepLabel}
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
