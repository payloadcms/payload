import type { AdminViewProps } from 'payload'

import React from 'react'

import { getDocumentData } from '../Document/getDocumentData.js'
import { CreateFirstUserClient } from './index.client.js'
import './index.scss'

export { generateCreateFirstUserMetadata } from './meta.js'

export const CreateFirstUserView: React.FC<AdminViewProps> = async ({ initPageResult }) => {
  const {
    locale,
    req,
    req: {
      payload: {
        config: {
          admin: { user: userSlug },
        },
        config,
      },
    },
  } = initPageResult

  const collectionConfig = config.collections?.find((collection) => collection?.slug === userSlug)
  const { auth: authOptions } = collectionConfig
  const loginWithUsername = authOptions.loginWithUsername

  const { formState } = await getDocumentData({
    collectionConfig,
    locale,
    req,
    schemaPath: `_${collectionConfig.slug}.auth`,
  })

  return (
    <div className="create-first-user">
      <h1>{req.t('general:welcome')}</h1>
      <p>{req.t('authentication:beginCreateFirstUser')}</p>
      <CreateFirstUserClient
        initialState={formState}
        loginWithUsername={loginWithUsername}
        userSlug={userSlug}
      />
    </div>
  )
}
