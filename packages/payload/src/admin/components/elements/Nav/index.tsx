import { ModalToggler, useModal } from '@faceless-ui/modal'
import React, { Fragment, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import { useConfig } from '../../utilities/Config'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import Hamburger from '../Hamburger'
import { MainMenuDrawer, mainMenuSlug } from '../MainMenu'
import './index.scss'

const baseClass = 'nav'

const DefaultNav = () => {
  const history = useHistory()
  const { closeModal, isModalOpen } = useModal()
  const isOpen = isModalOpen(mainMenuSlug)

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
          !isOpen && `${baseClass}--show-bg`,
          isOpen && `${baseClass}--main-menu-open`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={`${baseClass}__bg`} />
        <div className={`${baseClass}__content`}>
          <ModalToggler className={`${baseClass}__modalToggler`} slug={mainMenuSlug}>
            <Hamburger isActive={isOpen} />
          </ModalToggler>
        </div>
      </header>
      <MainMenuDrawer />
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
