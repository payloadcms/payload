import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useHistory, useLocation } from 'react-router-dom'

import Button from '../../elements/Button'
import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import FormSubmit from '../../forms/Submit'
import Email from '../../forms/field-types/Email'
import Password from '../../forms/field-types/Password'
import Logo from '../../graphics/Logo'
import MinimalTemplate from '../../templates/Minimal'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'
import './index.scss'

const baseClass = 'login'

const Login: React.FC = () => {
  const history = useHistory()
  const { t } = useTranslation('authentication')
  const { fetchFullUser, user } = useAuth()
  const config = useConfig()
  const {
    admin: { autoLogin, components: { afterLogin, beforeLogin } = {}, logoutRoute, user: userSlug },
    collections,
    routes: { admin, api },
    serverURL,
  } = config

  const collection = collections.find(({ slug }) => slug === userSlug)

  // Fetch 'redirect' from the query string which denotes the URL the user originally tried to visit. This is set in the Routes.tsx file when a user tries to access a protected route and is redirected to the login screen.
  const query = new URLSearchParams(useLocation().search)
  const redirect = query.get('redirect')

  const onSuccess = async (data) => {
    if (data.token) {
      await fetchFullUser()

      // Ensure the redirect always starts with the admin route, and concatenate the redirect path
      history.push(admin + (redirect || ''))
    }
  }

  const prefillForm = autoLogin && autoLogin.prefillOnly

  return (
    <React.Fragment>
      {user ? (
        // Logout
        <MinimalTemplate className={baseClass}>
          <Meta description={t('loginUser')} keywords={t('login')} title={t('login')} />
          <div className={`${baseClass}__wrap`}>
            <h1>{t('alreadyLoggedIn')}</h1>
            <p>
              <Trans i18nKey="loggedIn" t={t}>
                <Link to={`${admin}${logoutRoute}`}>{t('logOut')}</Link>
              </Trans>
            </p>
            <Button buttonStyle="secondary" el="link" to={admin}>
              {t('general:backToDashboard')}
            </Button>
          </div>
        </MinimalTemplate>
      ) : (
        // Login
        <MinimalTemplate className={baseClass}>
          <Meta description={t('loginUser')} keywords={t('login')} title={t('login')} />
          <div className={`${baseClass}__brand`}>
            <Logo />
          </div>
          {Array.isArray(beforeLogin) && beforeLogin.map((Component, i) => <Component key={i} />)}
          {!collection?.auth?.disableLocalStrategy && (
            <Form
              action={`${serverURL}${api}/${userSlug}/login`}
              className={`${baseClass}__form`}
              disableSuccessStatus
              initialData={
                prefillForm
                  ? {
                      email: autoLogin.email,
                      password: autoLogin.password,
                    }
                  : undefined
              }
              method="post"
              onSuccess={onSuccess}
              waitForAutocomplete
            >
              <FormLoadingOverlayToggle action="loading" name="login-form" />
              <div className={`${baseClass}__inputWrap`}>
                <Email
                  admin={{ autoComplete: 'email' }}
                  label={t('general:email')}
                  name="email"
                  required
                />
                <Password
                  autoComplete="off"
                  label={t('general:password')}
                  name="password"
                  required
                />
              </div>
              <Link to={`${admin}/forgot`}>{t('forgotPasswordQuestion')}</Link>
              <FormSubmit>{t('login')}</FormSubmit>
            </Form>
          )}
          {Array.isArray(afterLogin) && afterLogin.map((Component, i) => <Component key={i} />)}
        </MinimalTemplate>
      )}
    </React.Fragment>
  )
}

export default Login
