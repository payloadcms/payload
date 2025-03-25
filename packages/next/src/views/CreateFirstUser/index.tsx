import type { AdminViewServerProps } from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import React from 'react'

import { getDocPreferences } from '../Document/getDocPreferences.js'
import { getDocumentData } from '../Document/getDocumentData.js'
import { getDocumentPermissions } from '../Document/getDocumentPermissions.js'
import { CreateFirstUserClient } from './index.client.js'
import './index.scss'

export async function CreateFirstUserView({ initPageResult }: AdminViewServerProps) {
  const {
    locale,
    req,
    req: {
      payload: {
        collections,
        config: {
          admin: { user: userSlug },
        },
      },
    },
  } = initPageResult

  const collectionConfig = collections?.[userSlug]?.config
  const { auth: authOptions } = collectionConfig
  const loginWithUsername = authOptions.loginWithUsername

  // Fetch the data required for the view
  const data = await getDocumentData({
    collectionSlug: collectionConfig.slug,
    locale,
    payload: req.payload,
    req,
    user: req.user,
  })

  // Get document preferences
  const docPreferences = await getDocPreferences({
    collectionSlug: collectionConfig.slug,
    payload: req.payload,
    user: req.user,
  })

  // Get permissions
  const { docPermissions } = await getDocumentPermissions({
    collectionConfig,
    data,
    req,
  })

  // Build initial form state from data
  const { state: formState } = await buildFormState({
    collectionSlug: collectionConfig.slug,
    data,
    docPermissions,
    docPreferences,
    locale: locale?.code,
    operation: 'create',
    renderAllFields: true,
    req,
    schemaPath: collectionConfig.slug,
    skipValidation: true,
  })

  return (
    <div className="create-first-user">
      <h1>{req.t('general:welcome')}</h1>
      <p>{req.t('authentication:beginCreateFirstUser')}</p>
      <CreateFirstUserClient
        docPermissions={docPermissions}
        docPreferences={docPreferences}
        initialState={formState}
        loginWithUsername={loginWithUsername}
        userSlug={userSlug}
      />
    </div>
  )
}
