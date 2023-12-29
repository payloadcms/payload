import React, { Fragment } from 'react'

import { Logo } from '@payloadcms/ui/graphics'
import { MinimalTemplate, LoginForm } from '@payloadcms/ui'
import './index.scss'
import type { SanitizedConfig } from 'payload/types'
import i18n from 'i18next'
import { meta } from '../../utilities/meta'
import { Metadata } from 'next'
import { initPage } from '../../utilities/initPage'
import { redirect } from 'next/navigation'

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
  searchParams: { [key: string]: string | string[] | undefined }
}> = async ({ config: configPromise, searchParams }) => {
  const { config, user } = await initPage(configPromise)

  const {
    admin: { components: { afterLogin, beforeLogin } = {}, logoutRoute, user: userSlug },
    routes: { admin },
    collections,
  } = config

  if (user) {
    redirect(admin)
  }

  const collection = collections.find(({ slug }) => slug === userSlug)

  return (
    <MinimalTemplate className={baseClass}>
      <Fragment>
        <div className={`${baseClass}__brand`}>
          <Logo config={config} />
        </div>
        {Array.isArray(beforeLogin) && beforeLogin.map((Component, i) => <Component key={i} />)}
        {!collection?.auth?.disableLocalStrategy && (
          <LoginForm config={config} searchParams={searchParams} />
        )}
        {Array.isArray(afterLogin) && afterLogin.map((Component, i) => <Component key={i} />)}
      </Fragment>
    </MinimalTemplate>
  )
}
