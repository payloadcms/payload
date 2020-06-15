import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Email from '../Email';
import Password from '../Password';
import Checkbox from '../Checkbox';
import Button from '../../../elements/Button';
import ConfirmPassword from '../ConfirmPassword';

import './index.scss';

const baseClass = 'auth-fields';

const Auth = (props) => {
  const { initialData, useAPIKey } = props;
  const [changingPassword, setChangingPassword] = useState(false);

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
          <Button
            size="small"
            buttonStyle="secondary"
            onClick={() => setChangingPassword(false)}
          >
            Cancel
          </Button>
        </div>
      )}
      {!changingPassword && (
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
            label="Enable API Key"
            name="enableAPIKey"
          />
        </div>
      )}
    </div>
  );
};

Auth.defaultProps = {
  initialData: undefined,
  useAPIKey: false,
};

Auth.propTypes = {
  fieldTypes: PropTypes.shape({}).isRequired,
  initialData: PropTypes.shape({}),
  useAPIKey: PropTypes.bool,
};

export default Auth;
