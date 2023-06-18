import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import Logo from '../../graphics/Logo';
import MinimalTemplate from '../../templates/Minimal';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import Password from '../../forms/field-types/Password';
import FormSubmit from '../../forms/Submit';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import { FormLoadingOverlayToggle } from '../../elements/Loading';

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

  const onSuccess = (data) => {
    if (data.token) {
      setToken(data.token);
      history.push(admin);
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
