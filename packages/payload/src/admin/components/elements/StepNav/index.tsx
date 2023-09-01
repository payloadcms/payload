import React, { createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import type { Context as ContextType } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import Chevron from '../../icons/Chevron'
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

const StepNav: React.FC = () => {
  const { i18n, t } = useTranslation()
  const dashboardLabel = <span>{t('general:dashboard')}</span>
  const { stepNav } = useStepNav()
  const config = useConfig()
  const {
    routes: { admin },
  } = config

  return (
    <nav className="step-nav">
      {stepNav.length > 0 ? (
        <Link to={admin}>
          {dashboardLabel}
          <Chevron />
        </Link>
      ) : (
        dashboardLabel
      )}
      {stepNav.map((item, i) => {
        const StepLabel = <span key={i}>{getTranslation(item.label, i18n)}</span>

        const Step =
          stepNav.length === i + 1 ? (
            StepLabel
          ) : (
            <Link key={i} to={item.url}>
              {StepLabel}
              <Chevron />
            </Link>
          )

        return Step
      })}
    </nav>
  )
}

export { StepNavProvider, useStepNav }

export default StepNav
