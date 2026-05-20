import type {
  DocumentPreferences,
  FormState,
  LoginWithUsernameOptions,
  SanitizedDocumentPermissions,
} from 'payload'

import React from 'react'

import { CreateFirstUserClient } from './index.client.js'
import './index.css'

const baseClass = 'create-first-user'

export type CreateFirstUserViewProps = {
  beginMessage: string
  docPermissions: SanitizedDocumentPermissions
  docPreferences: DocumentPreferences
  formState: FormState
  loginWithUsername?: false | LoginWithUsernameOptions
  userSlug: string
  welcomeMessage: string
}

export function CreateFirstUserView({
  beginMessage,
  docPermissions,
  docPreferences,
  formState,
  loginWithUsername,
  userSlug,
  welcomeMessage,
}: CreateFirstUserViewProps) {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h1>{welcomeMessage}</h1>
        <p>{beginMessage}</p>
      </div>
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
