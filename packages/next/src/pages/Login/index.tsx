import React from 'react'
import { SanitizedConfig } from 'payload/types'
import { Login as LoginView } from '@payloadcms/ui/views'
import Link from 'next/link'
import type { Metadata } from 'next'
import i18n from 'i18next'
import { meta } from '../../utilities/meta'

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

export const Login = async ({ config: configPromise }: { config: Promise<SanitizedConfig> }) => {
  const config = await configPromise
  return <LoginView config={config} Link={Link} />
}

export default Login
