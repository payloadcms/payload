import React, { Fragment } from 'react'

import { Logo } from '@payloadcms/ui/graphics'
import { MinimalTemplate } from '@payloadcms/ui'
import type { SanitizedConfig } from 'payload/types'
import { meta } from '../../utilities/meta'
import { Metadata } from 'next'
import { initPage } from '../../utilities/initPage'
import { redirect } from 'next/navigation'
import { getNextT } from '../../utilities/getNextT'
import './index.scss'
import { LoginForm } from './LoginForm'

const baseClass = 'login'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const t = getNextT({
    config: await config,
  })

  return meta({
    title: t('authentication:login'),
    description: `${t('authentication:login')}`,
    keywords: `${t('authentication:login')}`,
    config,
  })
}

export const Login: React.FC<{
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}> = async ({ config: configPromise, searchParams }) => {
  const { config, user } = await initPage({ configPromise })

  const {
    admin: { components: { afterLogin, beforeLogin } = {}, user: userSlug },
    routes: { admin },
    collections,
  } = config

  if (user) {
    redirect(admin)
  }

  const collectionConfig = collections.find(({ slug }) => slug === userSlug)

  return (
    <MinimalTemplate className={baseClass}>
      <Fragment>
        <div className={`${baseClass}__brand`}>
          <Logo config={config} />
        </div>
        {Array.isArray(beforeLogin) && beforeLogin.map((Component, i) => <Component key={i} />)}
        {!collectionConfig?.auth?.disableLocalStrategy && <LoginForm />}
        {Array.isArray(afterLogin) && afterLogin.map((Component, i) => <Component key={i} />)}
      </Fragment>
    </MinimalTemplate>
  )
}
