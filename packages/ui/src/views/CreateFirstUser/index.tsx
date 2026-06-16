import type {
  AdminViewServerProps,
  SanitizedDocumentPermissions,
  SanitizedFieldsPermissions,
} from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { CreateFirstUserClient } from '../../exports/client/index.js'
import { buildFormState } from '../../utilities/buildFormState.js'
import { getDocPreferences } from '../../utilities/getDocPreferences.js'
import { getDocumentData } from '../../utilities/getDocumentData.js'
import './index.css'

const baseClass = 'create-first-user'

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

  const baseFields: SanitizedFieldsPermissions = Object.fromEntries(
    collectionConfig.fields
      .filter((f): f is { name: string } & typeof f => 'name' in f && typeof f.name === 'string')
      .map((f) => [f.name, { create: true }]),
  )

  // In create-first-user we should always allow all fields
  const docPermissionsForForm: SanitizedDocumentPermissions = {
    create: true,
    delete: true,
    fields: baseFields,
    read: true,
    readVersions: true,
    update: true,
  }

  // Build initial form state from data
  const { state: formState } = await buildFormState({
    collectionSlug: collectionConfig.slug,
    data,
    docPermissions: docPermissionsForForm,
    docPreferences,
    locale: locale?.code,
    operation: 'create',
    renderAllFields: true,
    req,
    schemaPath: collectionConfig.slug,
    skipClientConfigAuth: true,
    skipValidation: true,
  })

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h1>{req.t('general:welcome')}</h1>
        <p>{req.t('authentication:beginCreateFirstUser')}</p>
      </div>
      <CreateFirstUserClient
        docPermissions={docPermissionsForForm}
        docPreferences={docPreferences}
        initialState={formState}
        loginWithUsername={loginWithUsername}
        userSlug={userSlug}
      />
    </div>
  )
}
