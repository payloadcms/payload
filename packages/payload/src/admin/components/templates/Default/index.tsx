import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { Hamburger } from '../../elements/Hamburger'
import { AppHeader } from '../../elements/Header'
import { Nav as DefaultNav } from '../../elements/Nav'
import { NavToggler } from '../../elements/Nav/NavToggler'
import { useNav } from '../../elements/Nav/context'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import './index.scss'

const baseClass = 'template-default'

const Default: React.FC<Props> = ({ children, className }) => {
  const {
    admin: {
      components: { Nav: CustomNav } = {
        Nav: undefined,
      },
    } = {},
  } = useConfig()

  const { t } = useTranslation('general')

  const { navOpen, setNavOpen } = useNav()

  return (
    <Fragment>
      <Meta
        description={`${t('dashboard')} Payload`}
        keywords={`${t('dashboard')}, Payload`}
        title={t('dashboard')}
      />
      <div
        className={[baseClass, className, navOpen && `${baseClass}--nav-open`]
          .filter(Boolean)
          .join(' ')}
      >
        <RenderCustomComponent CustomComponent={CustomNav} DefaultComponent={DefaultNav} />
        <div className={`${baseClass}__wrap`}>
          <AppHeader />
          {children}
          <button
            aria-label={t('close')}
            className={`${baseClass}__nav-overlay`}
            onClick={() => setNavOpen(!navOpen)}
            type="button"
          />
        </div>
      </div>
      <NavToggler className={`${baseClass}__nav-toggler`} id="nav-toggler">
        <Hamburger closeIcon="collapse" isActive={navOpen} />
      </NavToggler>
    </Fragment>
  )
}

export default Default
