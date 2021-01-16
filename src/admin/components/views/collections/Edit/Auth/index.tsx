import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useConfig } from '@payloadcms/config-provider';
import Email from '../../../../forms/field-types/Email';
import Password from '../../../../forms/field-types/Password';
import Checkbox from '../../../../forms/field-types/Checkbox';
import Button from '../../../../elements/Button';
import ConfirmPassword from '../../../../forms/field-types/ConfirmPassword';
import { useWatchForm, useFormModified } from '../../../../forms/Form/context';
import { Props } from './types';

import APIKey from './APIKey';

import './index.scss';

const baseClass = 'auth-fields';

const Auth: React.FC<Props> = (props) => {
  const { useAPIKey, requirePassword, verify, collection: { slug }, email } = props;
  const [changingPassword, setChangingPassword] = useState(requirePassword);
  const { getField } = useWatchForm();
  const modified = useFormModified();

  const enableAPIKey = getField('enableAPIKey');

  useEffect(() => {
    if (!modified) {
      setChangingPassword(false);
    }
  }, [modified]);

  const {
    serverURL,
    routes: {
      api,
    },
  } = useConfig();

  const unlock = useCallback(async () => {
    const url = `${serverURL}${api}/${slug}/unlock`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
      method: 'post',
    });

    if (response.status === 200) {
      toast.success('Successfully unlocked', { autoClose: 3000 });
    } else {
      toast.error('Successfully unlocked');
    }
  }, [serverURL, api, slug, email]);

  return (
    <div className={baseClass}>
      <Email
        required
        name="email"
        label="Email"
        admin={{ autoComplete: 'email' }}
      />
      {(changingPassword || requirePassword) && (
        <div className={`${baseClass}__changing-password`}>
          <Password
            autoComplete="off"
            required
            name="password"
            label="New Password"
          />
          <ConfirmPassword />
          {!requirePassword && (
            <Button
              size="small"
              buttonStyle="secondary"
              onClick={() => setChangingPassword(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
      {(!changingPassword && !requirePassword) && (
        <Button
          size="small"
          buttonStyle="secondary"
          onClick={() => setChangingPassword(true)}
        >
          Change Password
        </Button>
      )}
      <Button
        size="small"
        buttonStyle="secondary"
        onClick={() => unlock()}
      >
        Force Unlock
      </Button>
      {useAPIKey && (
        <div className={`${baseClass}__api-key`}>
          <Checkbox
            label="Enable API Key"
            name="enableAPIKey"
          />
          {enableAPIKey?.value && (
            <APIKey />
          )}
        </div>
      )}
      {verify && (
        <Checkbox
          label="Verified"
          name="_verified"
        />
      )}
    </div>
  );
};

export default Auth;
