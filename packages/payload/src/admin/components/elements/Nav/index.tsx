import { ModalToggler, useModal } from '@faceless-ui/modal'
import React, { Fragment, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'

import Account from '../../graphics/Account'
import { useConfig } from '../../utilities/Config'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import Hamburger from '../Hamburger'
import Localizer from '../Localizer'
import { MainMenu, mainMenuSlug } from '../MainMenu'
import StepNav from '../StepNav'
import './index.scss'

const baseClass = 'nav'

const DefaultNav = () => {
  const history = useHistory()
  const { closeModal, isModalOpen, oneModalIsOpen } = useModal()
  const { t } = useTranslation()
  const isMainMenuOpen = isModalOpen(mainMenuSlug)

  const {
    routes: { admin: adminRoute },
  } = useConfig()

  useEffect(
    () =>
      history.listen(() => {
        closeModal(mainMenuSlug)
      }),
    [history, closeModal],
  )

  return (
    <Fragment>
      <header
        className={[
          baseClass,
          !isMainMenuOpen && `${baseClass}--show-bg`,
          isMainMenuOpen && `${baseClass}--main-menu-open`,
          oneModalIsOpen && !isMainMenuOpen && `${baseClass}--hide`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={`${baseClass}__bg`} />
        <div className={`${baseClass}__content`}>
          <ModalToggler className={`${baseClass}__modalToggler`} slug={mainMenuSlug}>
            <Hamburger isActive={isMainMenuOpen} />
          </ModalToggler>
          <div className={`${baseClass}__nav-wrapper`}>
            <StepNav className={`${baseClass}__step-nav`} />
            <div className={`${baseClass}__controls`}>
              <Localizer className={`${baseClass}__localizer`} />
              <Link
                aria-label={t('authentication:account')}
                className={`${baseClass}__account`}
                to={`${adminRoute}/account`}
              >
                <Account />
              </Link>
            </div>
          </div>
        </div>
      </header>
      <MainMenu />
    </Fragment>
  )
}

const Nav: React.FC = () => {
  const {
    admin: {
      components: { Nav: CustomNav } = {
        Nav: undefined,
      },
    } = {},
  } = useConfig()

  return <RenderCustomComponent CustomComponent={CustomNav} DefaultComponent={DefaultNav} />
}

export default Nav
