import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { Button, Email, Form, FormSubmit, MinimalTemplate, Translation } from '@payloadcms/ui'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { InitPageResult } from '../../utilities/initPage'

import { getNextI18n } from '../../utilities/getNextI18n'
import { meta } from '../../utilities/meta'

export const generateMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const config = await configPromise

  const { t } = await getNextI18n({
    config,
  })

  return meta({
    config,
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    title: t('authentication:forgotPassword'),
  })
}

type Props = {
  baseClass: string
  page: InitPageResult
}
export const ForgotPassword: React.FC<Props> = async ({ page }) => {
  const { req } = page

  const {
    i18n,
    payload: { config },
    user,
  } = req

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
      <Fragment>
        <h1>{i18n.t('authentication:alreadyLoggedIn')}</h1>
        <p>
          <Translation
            elements={{
              '0': ({ children }) => <Link href={`${admin}/account`}>{children}</Link>,
            }}
            i18nKey="authentication:loggedInChangePassword"
            t={i18n.t}
          />
        </p>
        <br />
        <Button buttonStyle="secondary" el="link" to={admin}>
          {i18n.t('general:backToDashboard')}
        </Button>
      </Fragment>
    )
  }

  // if (hasSubmitted) {
  //   return (
  //     <Fragment>
  //       <h1>{i18n.t('authentication:emailSent')}</h1>
  //       <p>{i18n.t('authentication:checkYourEmailForPasswordReset')}</p>
  //     </Fragment>
  //   )
  // }

  return (
    <Fragment>
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
    </Fragment>
  )
}
