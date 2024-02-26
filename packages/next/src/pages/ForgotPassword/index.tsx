import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { Button, Email, Form, FormSubmit, MinimalTemplate, Translation } from '@payloadcms/ui'
import Link from 'next/link'
import React from 'react'

import { getNextI18n } from '../../utilities/getNextI18n'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'

const baseClass = 'forgot-password'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const { t } = await getNextI18n({
    config: await config,
  })

  return meta({
    config,
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    title: t('authentication:forgotPassword'),
  })
}

export const ForgotPassword: React.FC<{
  config: Promise<SanitizedConfig>
}> = async ({ config: configPromise }) => {
  const { config, i18n, user } = await initPage({ config: configPromise })

  const {
    admin: { user: userSlug },
    routes: { admin, api },
    serverURL,
  } = config

  // const handleResponse = (res) => {
  //   res.json().then(
  //     () => {
  //       setHasSubmitted(true)
  //     },
  //     () => {
  //       toast.error(i18n.t('authentication:emailNotValid'))
  //     },
  //   )
  // }

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <h1>{i18n.t('authentication:alreadyLoggedIn')}</h1>
        <p>
          <Translation
            elements={{
              '0': ({ children }) => <Link children={children} href={`${admin}/account`} />,
            }}
            i18nKey="authentication:loggedInChangePassword"
            t={i18n.t}
          />
        </p>
        <br />
        <Button buttonStyle="secondary" el="link" to={admin}>
          {i18n.t('general:backToDashboard')}
        </Button>
      </MinimalTemplate>
    )
  }

  // if (hasSubmitted) {
  //   return (
  //     <MinimalTemplate className={baseClass}>
  //       <h1>{i18n.t('authentication:emailSent')}</h1>
  //       <p>{i18n.t('authentication:checkYourEmailForPasswordReset')}</p>
  //     </MinimalTemplate>
  //   )
  // }

  return (
    <MinimalTemplate className={baseClass}>
      <Form
        action={`${serverURL}${api}/${userSlug}/forgot-password`}
        // handleResponse={handleResponse}
        method="POST"
      >
        <h1>{i18n.t('authentication:forgotPassword')}</h1>
        <p>{i18n.t('authentication:forgotPasswordEmailInstructions')}</p>
        <Email autoComplete="email" label={i18n.t('general:emailAddress')} name="email" required />
        <FormSubmit>{i18n.t('general:submit')}</FormSubmit>
      </Form>
      <Link href={`${admin}/login`}>{i18n.t('authentication:backToLogin')}</Link>
    </MinimalTemplate>
  )
}
