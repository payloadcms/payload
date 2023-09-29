import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { AppHeader } from '../../elements/Header'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'
import { Nav as DefaultNav } from '../../elements/Nav'
import { useNav } from '../../elements/Nav/context'
import { NavToggler } from '../../elements/Nav/NavToggler'

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
            type="button"
            className={`${baseClass}__nav-overlay`}
            aria-label={t('menu')}
            onClick={() => setNavOpen(!navOpen)}
          />
        </div>
      </div>
      <NavToggler className={`${baseClass}__nav-toggler`} id="nav-toggler" />
    </Fragment>
  )
}

export default Default
