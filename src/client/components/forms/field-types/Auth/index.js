import React from 'react';
import PropTypes from 'prop-types';
import Email from '../Email';
import Password from '../Password';
import ConfirmPassword from '../ConfirmPassword';

import './index.scss';

const baseClass = 'auth-fields';

const Auth = (props) => {
  const { initialData } = props;

  return (
    <div className={baseClass}>
      <Email
        required
        name="email"
        label="Email"
        initialData={initialData?.email}
      />
      <Password
        required
        name="password"
        label="New Password"
      />
      <ConfirmPassword />
    </div>
  );
};

Auth.defaultProps = {
  initialData: undefined,
};

Auth.propTypes = {
  fieldTypes: PropTypes.shape({}).isRequired,
  initialData: PropTypes.shape({}),
};

export default Auth;
