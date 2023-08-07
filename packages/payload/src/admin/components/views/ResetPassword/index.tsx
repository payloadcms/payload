import React from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Trans, useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import MinimalTemplate from '../../templates/Minimal';
import Form from '../../forms/Form';
import Password from '../../forms/field-types/Password';
import ConfirmPassword from '../../forms/field-types/ConfirmPassword';
import FormSubmit from '../../forms/Submit';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import HiddenInput from '../../forms/field-types/HiddenInput';


import './index.scss';

const baseClass = 'reset-password';

const ResetPassword: React.FC = () => {
  const config = useConfig();
  const { admin: { user: userSlug, logoutRoute }, serverURL, routes: { admin, api } } = config;
  const { token } = useParams<{ token?: string }>();
  const history = useHistory();
  const { user, setToken } = useAuth();
  const { t } = useTranslation('authentication');

  const onSuccess = (data) => {
    if (data.token) {
      setToken(data.token);
      history.push(`${admin}`);
    } else {
      history.push(`${admin}/login`);
      toast.success(t('general:updatedSuccessfully'), { autoClose: 3000 });
    }
  };

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <Meta
          title={t('resetPassword')}
          description={t('resetPassword')}
          keywords={t('resetPassword')}
        />

        <div className={`${baseClass}__wrap`}>
          <h1>{t('alreadyLoggedIn')}</h1>
          <p>
            <Trans
              i18nKey="loginWithAnotherUser"
              t={t}
            >
              <Link to={`${admin}${logoutRoute}`}>log out</Link>
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
    );
  }

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <h1>{t('resetPassword')}</h1>
        <Form
          onSuccess={onSuccess}
          method="post"
          action={`${serverURL}${api}/${userSlug}/reset-password`}
          redirect={admin}
        >
          <Password
            label={t('newPassword')}
            name="password"
            autoComplete="off"
            required
          />
          <ConfirmPassword />
          <HiddenInput
            name="token"
            value={token}
          />
          <FormSubmit>{t('resetPassword')}</FormSubmit>
        </Form>
      </div>
    </MinimalTemplate>
  );
};

export default ResetPassword;
