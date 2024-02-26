import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { MinimalTemplate } from '@payloadcms/ui'
import React from 'react'

import { getNextT } from '../../utilities/getNextT'
import { meta } from '../../utilities/meta'
import { UnauthorizedClient } from './UnauthorizedClient'

export const generateMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const config = await configPromise

  const t = await getNextT({
    config,
  })

  return meta({
    config,
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    title: t('error:unauthorized'),
  })
}

export const Unauthorized: React.FC<{
  config: Promise<SanitizedConfig>
}> = async ({ config: configPromise }) => {
  const config = await configPromise

  const {
    admin: { logoutRoute },
    routes: { admin },
  } = config

  return (
    <MinimalTemplate className="unauthorized">
      <UnauthorizedClient logoutRoute={`${admin}${logoutRoute}`} />
    </MinimalTemplate>
  )
}
