import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Trans, useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import MinimalTemplate from '../../templates/Minimal';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import FormSubmit from '../../forms/Submit';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';

import './index.scss';

const baseClass = 'forgot-password';

const ForgotPassword: React.FC = () => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation('authentication');
  const {
    admin: { user: userSlug },
    serverURL,
    routes: {
      admin,
      api,
    },
  } = useConfig();

  const handleResponse = (res) => {
    res.json()
      .then(() => {
        setHasSubmitted(true);
      }, () => {
        toast.error(t('emailNotValid'));
      });
  };

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <Meta
          title={t('forgotPassword')}
          description={t('forgotPassword')}
          keywords={t('forgotPassword')}
        />

        <h1>{t('alreadyLoggedIn')}</h1>
        <p>
          <Trans
            i18nKey="loggedInChangePassword"
            t={t}
          >
            <Link to={`${admin}/account`}>account</Link>
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
      </MinimalTemplate>
    );
  }

  if (hasSubmitted) {
    return (
      <MinimalTemplate className={baseClass}>
        <h1>{t('emailSent')}</h1>
        <p>
          {t('checkYourEmailForPasswordReset')}
        </p>
      </MinimalTemplate>
    );
  }

  return (
    <MinimalTemplate className={baseClass}>
      <Form
        handleResponse={handleResponse}
        method="post"
        action={`${serverURL}${api}/${userSlug}/forgot-password`}
      >
        <h1>{t('forgotPassword')}</h1>
        <p>{t('forgotPasswordEmailInstructions')}</p>
        <Email
          label={t('general:emailAddress')}
          name="email"
          admin={{ autoComplete: 'email' }}
          required
        />
        <FormSubmit>{t('general:submit')}</FormSubmit>
      </Form>
      <Link to={`${admin}/login`}>{t('backToLogin')}</Link>
    </MinimalTemplate>
  );
};

export default ForgotPassword;
