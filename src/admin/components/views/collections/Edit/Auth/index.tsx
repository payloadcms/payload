import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../utilities/Config';
import Email from '../../../../forms/field-types/Email';
import Password from '../../../../forms/field-types/Password';
import Checkbox from '../../../../forms/field-types/Checkbox';
import Button from '../../../../elements/Button';
import ConfirmPassword from '../../../../forms/field-types/ConfirmPassword';
import { useFormModified, useFormFields } from '../../../../forms/Form/context';
import { Props } from './types';

import APIKey from './APIKey';

import './index.scss';

const baseClass = 'auth-fields';

const Auth: React.FC<Props> = (props) => {
  const { useAPIKey, requirePassword, verify, collection: { slug }, collection, email, operation, readOnly } = props;
  const [changingPassword, setChangingPassword] = useState(requirePassword);
  const enableAPIKey = useFormFields(([fields]) => fields.enableAPIKey);
  const dispatchFields = useFormFields((reducer) => reducer[1]);
  const modified = useFormModified();
  const { t, i18n } = useTranslation('authentication');

  const {
    serverURL,
    routes: {
      api,
    },
  } = useConfig();

  const handleChangePassword = useCallback(async (state: boolean) => {
    if (!state) {
      dispatchFields({ type: 'REMOVE', path: 'password' });
      dispatchFields({ type: 'REMOVE', path: 'confirm-password' });
    }

    setChangingPassword(state);
  }, [dispatchFields]);

  const unlock = useCallback(async () => {
    const url = `${serverURL}${api}/${slug}/unlock`;
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': i18n.language,
      },
      body: JSON.stringify({
        email,
      }),
      method: 'post',
    });

    if (response.status === 200) {
      toast.success(t('successfullyUnlocked'), { autoClose: 3000 });
    } else {
      toast.error(t('failedToUnlock'));
    }
  }, [i18n, serverURL, api, slug, email, t]);

  useEffect(() => {
    if (!modified) {
      setChangingPassword(false);
    }
  }, [modified]);

  if (collection.auth.disableLocalStrategy && !collection.auth.useAPIKey) {
    return null;
  }

  return (
    <div className={baseClass}>
      { !collection.auth.disableLocalStrategy && (
        <React.Fragment>
          <Email
            required
            name="email"
            label={t('general:email')}
            admin={{ autoComplete: 'email', readOnly }}
          />
          {(changingPassword || requirePassword) && (
            <div className={`${baseClass}__changing-password`}>
              <Password
                autoComplete="off"
                required
                name="password"
                label={t('newPassword')}
                disabled={readOnly}
              />
              <ConfirmPassword disabled={readOnly} />
              {!requirePassword && (
                <Button
                  size="small"
                  buttonStyle="secondary"
                  onClick={() => handleChangePassword(false)}
                  disabled={readOnly}
                >
                  {t('general:cancel')}
                </Button>
              )}
            </div>
          )}
          {(!changingPassword && !requirePassword) && (
            <Button
              id="change-password"
              size="small"
              buttonStyle="secondary"
              onClick={() => handleChangePassword(true)}
              disabled={readOnly}
            >
              {t('changePassword')}
            </Button>
          )}
          {operation === 'update' && (
            <Button
              size="small"
              buttonStyle="secondary"
              onClick={() => unlock()}
              disabled={readOnly}
            >
              {t('forceUnlock')}
            </Button>
          )}
        </React.Fragment>
      )}
      {useAPIKey && (
        <div className={`${baseClass}__api-key`}>
          <Checkbox
            label={t('enableAPIKey')}
            name="enableAPIKey"
            admin={{ readOnly }}
          />
          {enableAPIKey?.value && (
            <APIKey readOnly={readOnly} />
          )}
        </div>
      )}
      {verify && (
        <Checkbox
          label={t('verified')}
          name="_verified"
          admin={{ readOnly }}
        />
      )}
    </div>
  );
};

export default Auth;
