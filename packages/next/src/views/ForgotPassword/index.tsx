import type { AdminViewProps } from 'payload/types'

import { Button } from '@payloadcms/ui/elements/Button'
import { Translation } from '@payloadcms/ui/elements/Translation'
import { Email } from '@payloadcms/ui/fields/Email'
import { Form } from '@payloadcms/ui/forms/Form'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
import LinkImport from 'next/link.js'
import React, { Fragment } from 'react'

export { generateForgotPasswordMetadata } from './meta.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default
export const forgotPasswordBaseClass = 'forgot-password'

export const ForgotPasswordView: React.FC<AdminViewProps> = ({ initPageResult }) => {
  const {
    req: {
      i18n,
      payload: { config },
      user,
    },
  } = initPageResult

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
        <Button Link={Link} buttonStyle="secondary" el="link" to={admin}>
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
        initialState={{
          email: {
            initialValue: '',
            valid: false,
            value: undefined,
          },
        }}
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
