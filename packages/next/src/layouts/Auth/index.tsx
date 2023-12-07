import React, { Fragment } from 'react'
import { SanitizedConfig } from 'payload/types'
import { redirect } from 'next/navigation'
import i18n from 'i18next'
import { meta } from '../../utilities/meta'
import { Metadata } from 'next'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> =>
  meta({
    title: i18n.t('dashboard'),
    description: i18n.t('dashboard'),
    keywords: i18n.t('dashboard'),
    config,
  })

export const AuthLayout = async ({
  children,
  config: configPromise,
}: {
  children: React.ReactNode
  config: Promise<SanitizedConfig>
}) => {
  const config = await configPromise

  // TODO: call the me operation server-side
  let me = null

  if (!me) {
    redirect(`${config.routes.admin || '/admin'}/login`)
  }

  return <Fragment>{children}</Fragment>
}
