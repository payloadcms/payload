import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Email from '../Email';
import Password from '../Password';
import Checkbox from '../Checkbox';
import Button from '../../../elements/Button';
import ConfirmPassword from '../ConfirmPassword';
import { useFormFields } from '../../Form/context';
import APIKey from './APIKey';

import './index.scss';

const baseClass = 'auth-fields';

const Auth = (props) => {
  const { initialData, useAPIKey, requirePassword } = props;
  const [changingPassword, setChangingPassword] = useState(requirePassword);
  const { getField } = useFormFields();

  const enableAPIKey = getField('enableAPIKey');

  return (
    <div className={baseClass}>
      <Email
        required
        name="email"
        label="Email"
        initialData={initialData?.email}
        autoComplete="email"
      />
      {changingPassword && (
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
      {useAPIKey && (
        <div className={`${baseClass}__api-key`}>
          <Checkbox
            initialData={initialData?.enableAPIKey}
            label="Enable API Key"
            name="enableAPIKey"
          />
          {enableAPIKey?.value && (
            <APIKey initialData={initialData?.apiKey} />
          )}
        </div>
      )}
    </div>
  );
};

Auth.defaultProps = {
  initialData: undefined,
  useAPIKey: false,
  requirePassword: false,
};

Auth.propTypes = {
  fieldTypes: PropTypes.shape({}).isRequired,
  initialData: PropTypes.shape({
    enableAPIKey: PropTypes.bool,
    apiKey: PropTypes.string,
    email: PropTypes.string,
  }),
  useAPIKey: PropTypes.bool,
  requirePassword: PropTypes.bool,
};

export default Auth;
