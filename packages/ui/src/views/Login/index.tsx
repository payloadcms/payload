import React, { Fragment } from 'react'
import { Trans } from 'react-i18next'

import { Button } from '../../elements/Button'
import { Logo } from '../../graphics/Logo'
import { Minimal as MinimalTemplate } from '../../templates/Minimal'
// import Meta from '../../utilities/Meta'
import './index.scss'
import { LoginClient } from './index.client'
import type { SanitizedConfig } from 'payload/types'
import i18n from 'i18next'
import { LinkType } from '../../types'

const baseClass = 'login'

export const Login: React.FC<{
  Link: LinkType
  config: SanitizedConfig
}> = (props) => {
  const {
    Link,
    config,
    config: {
      admin: { components: { afterLogin, beforeLogin } = {}, logoutRoute, user: userSlug },
      routes: { admin },
      collections,
    },
  } = props

  const user = null

  const collection = collections.find(({ slug }) => slug === userSlug)

  return (
    <MinimalTemplate className={baseClass}>
      {/* <Meta
      description={i18n.t('loginUser')}
      keywords={i18n.t('login')}
      title={i18n.t('login')}
    /> */}
      {user ? (
        <Fragment>
          <div className={`${baseClass}__wrap`}>
            <h1>{i18n.t('alreadyLoggedIn')}</h1>
            <p>
              {/* <Trans i18nKey="loggedIn" t={i18n.t}>
                <Link to={`${admin}${logoutRoute}`}>{i18n.t('logOut')}</Link>
              </Trans> */}
            </p>
            <Button buttonStyle="secondary" el="link" to={admin}>
              {i18n.t('general:backToDashboard')}
            </Button>
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div className={`${baseClass}__brand`}>
            <Logo config={config} />
          </div>
          {Array.isArray(beforeLogin) && beforeLogin.map((Component, i) => <Component key={i} />)}
          {!collection?.auth?.disableLocalStrategy && <LoginClient />}
          {Array.isArray(afterLogin) && afterLogin.map((Component, i) => <Component key={i} />)}
        </Fragment>
      )}
    </MinimalTemplate>
  )
}
