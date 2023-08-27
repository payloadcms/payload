import React from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config/index.js';
import { useAuth } from '../../utilities/Auth/index.js';
import Logo from '../../graphics/Logo/index.js';
import MinimalTemplate from '../../templates/Minimal/index.js';
import Form from '../../forms/Form/index.js';
import Email from '../../forms/field-types/Email/index.js';
import Password from '../../forms/field-types/Password/index.js';
import FormSubmit from '../../forms/Submit/index.js';
import Button from '../../elements/Button/index.js';
import Meta from '../../utilities/Meta/index.js';
import { FormLoadingOverlayToggle } from '../../elements/Loading/index.js';

import './index.scss';

const baseClass = 'login';

const Login: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation('authentication');
  const { user, setToken } = useAuth();
  const config = useConfig();
  const {
    admin: {
      user: userSlug,
      logoutRoute,
      autoLogin,
      components: {
        beforeLogin,
        afterLogin,
      } = {},
    },
    serverURL,
    routes: {
      admin,
      api,
    },
    collections,
  } = config;

  const collection = collections.find(({ slug }) => slug === userSlug);

  // Fetch 'redirect' from the query string which denotes the URL the user originally tried to visit. This is set in the Routes.tsx file when a user tries to access a protected route and is redirected to the login screen.
  const query = new URLSearchParams(useLocation().search);
  const redirect = query.get('redirect');


  const onSuccess = (data) => {
    if (data.token) {
      setToken(data.token);

      // Ensure the redirect always starts with the admin route, and concatenate the redirect path
      history.push(admin + (redirect || ''));
    }
  };

  return (
    <React.Fragment>
      {user ? (
        // Logout
        <MinimalTemplate className={baseClass}>
          <Meta
            title={t('login')}
            description={t('loginUser')}
            keywords={t('login')}
          />
          <div className={`${baseClass}__wrap`}>
            <h1>{t('alreadyLoggedIn')}</h1>
            <p>
              <Trans
                i18nKey="loggedIn"
                t={t}
              >
                <Link to={`${admin}${logoutRoute}`}>{t('logOut')}</Link>
              </Trans>
            </p>
            <br />
            <Button
              el="link"
              buttonStyle="secondary"
              to={admin}
            >
              {t('general:backToDashboard')}
            </Button>
          </div>
        </MinimalTemplate>
      ) : (
        // Login
        <MinimalTemplate className={baseClass}>
          <Meta
            title={t('login')}
            description={t('loginUser')}
            keywords={t('login')}
          />
          <div className={`${baseClass}__brand`}>
            <Logo />
          </div>
          {Array.isArray(beforeLogin) && beforeLogin.map((Component, i) => <Component key={i} />)}
          {!collection.auth.disableLocalStrategy && (
            <Form
              disableSuccessStatus
              waitForAutocomplete
              onSuccess={onSuccess}
              method="post"
              action={`${serverURL}${api}/${userSlug}/login`}
              initialData={{
                email: autoLogin && autoLogin.prefillOnly ? autoLogin.email : undefined,
                password: autoLogin && autoLogin.prefillOnly ? autoLogin.password : undefined,
              }}
            >
              <FormLoadingOverlayToggle
                action="loading"
                name="login-form"
              />
              <Email
                label={t('general:email')}
                name="email"
                admin={{ autoComplete: 'email' }}
                required
              />
              <Password
                label={t('general:password')}
                name="password"
                autoComplete="off"
                required
              />
              <Link to={`${admin}/forgot`}>
                {t('forgotPasswordQuestion')}
              </Link>
              <FormSubmit>{t('login')}</FormSubmit>
            </Form>
          )}
          {Array.isArray(afterLogin) && afterLogin.map((Component, i) => <Component key={i} />)}
        </MinimalTemplate>

      )}
    </React.Fragment>
  );
};

export default Login;
