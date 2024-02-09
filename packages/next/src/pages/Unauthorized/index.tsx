import React from 'react'

import { MinimalTemplate } from '@payloadcms/ui'
import { SanitizedConfig } from 'payload/types'
import { meta } from '../../utilities/meta'
import { Metadata } from 'next'
import { getNextT } from '../../utilities/getNextT'
import { UnauthorizedClient } from './UnauthorizedClient'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const t = await getNextT({
    config: await config,
  })

  return meta({
    title: t('error:unauthorized'),
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    config,
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
