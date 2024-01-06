import React from 'react'

import { Button, Form, FormSubmit, Email, MinimalTemplate } from '@payloadcms/ui'
import { SanitizedConfig } from 'payload/types'
import Link from 'next/link'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'
import i18n from 'i18next'
import { Metadata } from 'next'

const baseClass = 'forgot-password'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> =>
  meta({
    title: i18n.t('forgotPassword'),
    description: i18n.t('forgotPassword'),
    keywords: i18n.t('forgotPassword'),
    config,
  })

export const ForgotPassword: React.FC<{
  config: Promise<SanitizedConfig>
}> = async ({ config: configPromise }) => {
  const { config, user } = await initPage({ configPromise })

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
  //       toast.error(t('emailNotValid'))
  //     },
  //   )
  // }

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <h1>
          {/* {t('alreadyLoggedIn')} */}
          Already Logged In
        </h1>
        <p>
          {/* <Trans i18nKey="loggedInChangePassword" t={t}> */}
          <Link href={`${admin}/account`}>account</Link>
          {/* </Trans> */}
        </p>
        <br />
        <Button buttonStyle="secondary" el="link" to={admin}>
          Back to Dashboard
          {/* {t('general:backToDashboard')} */}
        </Button>
      </MinimalTemplate>
    )
  }

  // if (hasSubmitted) {
  //   return (
  //     <MinimalTemplate className={baseClass}>
  //       <h1>{t('emailSent')}</h1>
  //       <p>{t('checkYourEmailForPasswordReset')}</p>
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
        <h1>
          Forgot Password
          {/* {t('forgotPassword')} */}
        </h1>
        <p>
          Enter your email address and we will send you a link to reset your password.
          {/* {t('forgotPasswordEmailInstructions')} */}
        </p>
        <Email
          admin={{ autoComplete: 'email' }}
          label="Email Address"
          // label={t('general:emailAddress')}
          name="email"
          required
        />
        <FormSubmit>
          Submit
          {/* {t('general:submit')} */}
        </FormSubmit>
      </Form>
      <Link href={`${admin}/login`}>
        Back to Login
        {/* {t('backToLogin')} */}
      </Link>
    </MinimalTemplate>
  )
}
