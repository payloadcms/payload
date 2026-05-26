import type {
  AdminViewServerProps,
  ComponentRenderer,
  DocumentPreferences,
  FormState,
  LoginWithUsernameOptions,
  SanitizedDocumentPermissions,
} from 'payload'

import React from 'react'

import { getCreateFirstUserData } from './getCreateFirstUserData.js'
import { CreateFirstUserClient } from './index.client.js'
import './index.css'

const baseClass = 'create-first-user'

export type DefaultCreateFirstUserViewProps = {
  beginMessage: string
  docPermissions: SanitizedDocumentPermissions
  docPreferences: DocumentPreferences
  formState: FormState
  loginWithUsername?: false | LoginWithUsernameOptions
  userSlug: string
  welcomeMessage: string
}

export function DefaultCreateFirstUserView({
  beginMessage,
  docPermissions,
  docPreferences,
  formState,
  loginWithUsername,
  userSlug,
  welcomeMessage,
}: DefaultCreateFirstUserViewProps) {
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

export async function CreateFirstUserView({
  initPageResult,
  renderComponent,
}: { renderComponent: ComponentRenderer } & AdminViewServerProps) {
  const { locale, req } = initPageResult
  const data = await getCreateFirstUserData({ locale, renderComponent, req })

  return <DefaultCreateFirstUserView {...data} />
}
