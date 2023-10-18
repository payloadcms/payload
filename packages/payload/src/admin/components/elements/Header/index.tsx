import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import Account from '../../graphics/Account'
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

  const { navOpen } = useNav()

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
            <div className={`${baseClass}__controls`}>
              {localization && (
                <LocalizerLabel
                  ariaLabel="invisible"
                  className={`${baseClass}__localizer-spacing`}
                />
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
      </div>
      <Localizer className={`${baseClass}__localizer`} />
    </header>
  )
}
