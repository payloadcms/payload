import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import Account from '../../graphics/Account'
import { useActions } from '../../utilities/ActionsProvider'
import { useConfig } from '../../utilities/Config'
import { Hamburger } from '../Hamburger'
import Localizer from '../Localizer'
import { LocalizerLabel } from '../Localizer/LocalizerLabel'
import { NavToggler } from '../Nav/NavToggler'
import { useNav } from '../Nav/context'
import StepNav from '../StepNav'
import './index.scss'

const baseClass = 'app-header'

export const AppHeader: React.FC = () => {
  const { t } = useTranslation()

  const {
    localization,
    routes: { admin: adminRoute },
  } = useConfig()

  const { actions } = useActions()

  const { navOpen } = useNav()

  const customControlsRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  useEffect(() => {
    const checkIsScrollable = () => {
      const el = customControlsRef.current
      if (el) {
        const scrollable = el.scrollWidth > el.clientWidth
        setIsScrollable(scrollable)
      }
    }

    checkIsScrollable()
    window.addEventListener('resize', checkIsScrollable)

    return () => {
      window.removeEventListener('resize', checkIsScrollable)
    }
  }, [actions])

  return (
    <header className={[baseClass, navOpen && `${baseClass}--nav-open`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__bg`} />
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__wrapper`}>
          <NavToggler className={`${baseClass}__mobile-nav-toggler`} tabIndex={-1}>
            <Hamburger />
          </NavToggler>
          <div className={`${baseClass}__controls-wrapper`}>
            <div className={`${baseClass}__step-nav-wrapper`}>
              <StepNav className={`${baseClass}__step-nav`} />
            </div>
            <div className={`${baseClass}__actions-wrapper`}>
              <div className={`${baseClass}__actions`} ref={customControlsRef}>
                {Array.isArray(actions) &&
                  actions.map((Component, i) => (
                    <div
                      className={
                        isScrollable && i === actions.length - 1 ? `${baseClass}__last-action` : ''
                      }
                      key={i}
                    >
                      <Component />
                    </div>
                  ))}
              </div>
              {isScrollable && <div className={`${baseClass}__gradient-placeholder`} />}
            </div>
            {localization && (
              <LocalizerLabel ariaLabel="invisible" className={`${baseClass}__localizer-spacing`} />
            )}
            <Link
              aria-label={t('authentication:account')}
              className={`${baseClass}__account`}
              tabIndex={0}
              to={`${adminRoute}/account`}
            >
              <Account />
            </Link>
          </div>
        </div>
      </div>
      <Localizer className={`${baseClass}__localizer`} />
    </header>
  )
}
