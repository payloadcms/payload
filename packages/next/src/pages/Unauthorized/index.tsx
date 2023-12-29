import React from 'react'

import { MinimalTemplate, Button } from '@payloadcms/ui'
import { SanitizedConfig } from 'payload/types'
import { meta } from '../../utilities/meta'
import { Metadata } from 'next'
import i18n from 'i18next'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> =>
  meta({
    title: i18n.t('error:unauthorized'),
    description: i18n.t('error:unauthorized'),
    keywords: i18n.t('error:unauthorized'),
    config,
  })

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
      <h2>
        Unauthorized
        {/* {t('error:unauthorized')} */}
      </h2>
      <p>
        Not Allowed
        {/* {t('error:notAllowedToAccessPage')} */}
      </p>
      <br />
      <Button el="link" to={`${admin}${logoutRoute}`}>
        Log out
        {/* {t('authentication:logOut')} */}
      </Button>
    </MinimalTemplate>
  )
}
