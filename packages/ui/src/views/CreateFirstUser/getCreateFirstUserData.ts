import type {
  ComponentRenderer,
  DocumentPreferences,
  FormState,
  Locale,
  LoginWithUsernameOptions,
  PayloadRequest,
  SanitizedDocumentPermissions,
  SanitizedFieldsPermissions,
} from 'payload'

import { buildFormState } from '../../utilities/buildFormState.js'
import { getDocPreferences } from '../Document/getDocPreferences.js'
import { getDocumentData } from '../Document/getDocumentData.js'

export type CreateFirstUserData = {
  beginMessage: string
  docPermissions: SanitizedDocumentPermissions
  docPreferences: DocumentPreferences
  formState: FormState
  loginWithUsername?: false | LoginWithUsernameOptions
  userSlug: string
  welcomeMessage: string
}

export async function getCreateFirstUserData({
  locale,
  renderComponent,
  req,
}: {
  locale: Locale
  renderComponent?: ComponentRenderer
  req: PayloadRequest
}): Promise<CreateFirstUserData> {
  const {
    payload: {
      collections,
      config: {
        admin: { user: userSlug },
      },
    },
  } = req

  const collectionConfig = collections?.[userSlug]?.config
  const { auth: authOptions } = collectionConfig
  const loginWithUsername = authOptions.loginWithUsername

  const data = await getDocumentData({
    collectionSlug: collectionConfig.slug,
    locale,
    payload: req.payload,
    req,
    user: req.user,
  })

  const docPreferences = await getDocPreferences({
    collectionSlug: collectionConfig.slug,
    payload: req.payload,
    user: req.user,
  })

  const baseFields: SanitizedFieldsPermissions = Object.fromEntries(
    collectionConfig.fields
      .filter((f): f is { name: string } & typeof f => 'name' in f && typeof f.name === 'string')
      .map((f) => [f.name, { create: true, read: true, update: true }]),
  )

  const docPermissions: SanitizedDocumentPermissions = {
    create: true,
    delete: true,
    fields: baseFields,
    read: true,
    readVersions: true,
    update: true,
  }

  const { state: formState } = await buildFormState(
    {
      collectionSlug: collectionConfig.slug,
      data,
      docPermissions,
      docPreferences,
      locale: locale?.code,
      operation: 'create',
      renderAllFields: true,
      req,
      schemaPath: collectionConfig.slug,
      skipClientConfigAuth: true,
      skipValidation: true,
    },
    renderComponent,
  )

  return {
    beginMessage: req.t('authentication:beginCreateFirstUser'),
    docPermissions,
    docPreferences,
    formState,
    loginWithUsername,
    userSlug,
    welcomeMessage: req.t('general:welcome'),
  }
}
