import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import Button from '../../elements/Button'
import Form from '../../forms/Form'
import FormSubmit from '../../forms/Submit'
import Email from '../../forms/field-types/Email'
import MinimalTemplate from '../../templates/Minimal'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'
import './index.scss'

const baseClass = 'forgot-password'

const ForgotPassword: React.FC = () => {
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const { user } = useAuth()
  const { t } = useTranslation('authentication')
  const {
    admin: { user: userSlug },
    routes: { admin, api },
    serverURL,
  } = useConfig()

  const handleResponse = (res) => {
    res.json().then(
      () => {
        setHasSubmitted(true)
      },
      () => {
        toast.error(t('emailNotValid'))
      },
    )
  }

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <Meta
          description={t('forgotPassword')}
          keywords={t('forgotPassword')}
          title={t('forgotPassword')}
        />

        <h1>{t('alreadyLoggedIn')}</h1>
        <p>
          <Trans i18nKey="loggedInChangePassword" t={t}>
            <Link to={`${admin}/account`}>account</Link>
          </Trans>
        </p>
        <br />
        <Button buttonStyle="secondary" el="link" to={admin}>
          {t('general:backToDashboard')}
        </Button>
      </MinimalTemplate>
    )
  }

  if (hasSubmitted) {
    return (
      <MinimalTemplate className={baseClass}>
        <h1>{t('emailSent')}</h1>
        <p>{t('checkYourEmailForPasswordReset')}</p>
      </MinimalTemplate>
    )
  }

  return (
    <MinimalTemplate className={baseClass}>
      <Form
        action={`${serverURL}${api}/${userSlug}/forgot-password`}
        handleResponse={handleResponse}
        method="post"
      >
        <h1>{t('forgotPassword')}</h1>
        <p>{t('forgotPasswordEmailInstructions')}</p>
        <Email
          admin={{ autoComplete: 'email' }}
          label={t('general:emailAddress')}
          name="email"
          required
        />
        <FormSubmit>{t('general:submit')}</FormSubmit>
      </Form>
      <Link to={`${admin}/login`}>{t('backToLogin')}</Link>
    </MinimalTemplate>
  )
}

export default ForgotPassword
