import React from 'react'

import { Button, Form, FormSubmit, Email, MinimalTemplate, Translation } from '@payloadcms/ui'
import { SanitizedConfig } from 'payload/types'
import Link from 'next/link'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'
import { Metadata } from 'next'
import { getNextT } from '../../utilities/getNextT'

const baseClass = 'forgot-password'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const t = await getNextT({
    config: await config,
  })

  return meta({
    title: t('authentication:forgotPassword'),
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    config,
  })
}

export const ForgotPassword: React.FC<{
  config: Promise<SanitizedConfig>
}> = async ({ config: configPromise }) => {
  const { config, user, i18n } = await initPage({ config: configPromise })

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
            t={i18n.t}
            i18nKey="authentication:loggedInChangePassword"
            elements={{
              '0': ({ children }) => <Link href={`${admin}/account`} children={children} />,
            }}
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
        <Email
          admin={{ autoComplete: 'email' }}
          label={i18n.t('general:emailAddress')}
          name="email"
          required
        />
        <FormSubmit>{i18n.t('general:submit')}</FormSubmit>
      </Form>
      <Link href={`${admin}/login`}>{i18n.t('authentication:backToLogin')}</Link>
    </MinimalTemplate>
  )
}
