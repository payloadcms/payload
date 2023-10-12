import React, { Fragment, createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Context as ContextType } from './types'

import { IconGraphic } from '../../../../exports/components/graphics'
import { getTranslation } from '../../../../utilities/getTranslation'
import { useConfig } from '../../utilities/Config'
import './index.scss'

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
    <nav className={['step-nav', className].filter(Boolean).join(' ')}>
      {stepNav.length > 0 ? (
        <Fragment>
          <Link to={admin}>
            <IconGraphic />
          </Link>
          <span>/</span>
        </Fragment>
      ) : (
        <IconGraphic />
      )}
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
  )
}

export { StepNavProvider, useStepNav }

export default StepNav
