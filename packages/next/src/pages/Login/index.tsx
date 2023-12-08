import React, { Fragment } from 'react'
import { Trans } from 'react-i18next'

import { Button } from '@payloadcms/ui/elements'
import { Logo } from '@payloadcms/ui/graphics'
import { Minimal as MinimalTemplate } from '@payloadcms/ui/templates'
import './index.scss'
import { LoginForm } from '@payloadcms/ui/elements'
import type { SanitizedConfig } from 'payload/types'
import i18n from 'i18next'
import { meta } from '../../utilities/meta'
import { Metadata } from 'next'
import Link from 'next/link'
import { login } from './action'

const baseClass = 'login'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> =>
  meta({
    title: i18n.t('login'),
    description: `${i18n.t('login')}`,
    keywords: `${i18n.t('login')}`,
    config,
  })

export const Login: React.FC<{
  config: Promise<SanitizedConfig>
}> = async ({ config: configPromise }) => {
  const config = await configPromise

  const {
    admin: { components: { afterLogin, beforeLogin } = {}, logoutRoute, user: userSlug },
    routes: { admin },
    collections,
  } = config

  const user = null

  const collection = collections.find(({ slug }) => slug === userSlug)

  return (
    <MinimalTemplate className={baseClass}>
      {user ? (
        <Fragment>
          <div className={`${baseClass}__wrap`}>
            <h1>{i18n.t('alreadyLoggedIn')}</h1>
            <p>
              {/* <Trans i18nKey="loggedIn" t={i18n.t}> */}
              <Link href={`${admin}${logoutRoute}`}>{i18n.t('logOut')}</Link>
              {/* </Trans> */}
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
          {!collection?.auth?.disableLocalStrategy && <LoginForm action={login} />}
          {Array.isArray(afterLogin) && afterLogin.map((Component, i) => <Component key={i} />)}
        </Fragment>
      )}
    </MinimalTemplate>
  )
}
