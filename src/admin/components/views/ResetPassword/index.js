import React from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useConfig } from '../../providers/Config';
import MinimalTemplate from '../../templates/Minimal';
import Form from '../../forms/Form';
import Password from '../../forms/field-types/Password';
import ConfirmPassword from '../../forms/field-types/ConfirmPassword';
import FormSubmit from '../../forms/Submit';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';
import { useAuthentication } from '../../providers/Authentication';

import './index.scss';
import HiddenInput from '../../forms/field-types/HiddenInput';

const baseClass = 'reset-password';

const ResetPassword = () => {
  const { admin: { user: userSlug }, serverURL, routes: { admin, api } } = useConfig();
  const { token } = useParams();
  const history = useHistory();
  const { user, setToken } = useAuthentication();

  const onSuccess = (data) => {
    if (data.token) {
      setToken(data.token);
      history.push(`${admin}`);
    }
  };

  if (user) {
    return (
      <MinimalTemplate className={baseClass}>
        <Meta
          title="Reset Password"
          description="Reset password"
          keywords="Reset Password, Payload, CMS"
        />

        <div className={`${baseClass}__wrap`}>
          <h1>Already logged in</h1>
          <p>
            To log in with another user, you should
            {' '}
            <Link to={`${admin}/logout`}>log out</Link>
            {' '}
            first.
          </p>
          <br />
          <Button
            el="link"
            buttonStyle="secondary"
            to={admin}
          >
            Back to Dashboard
          </Button>
        </div>
      </MinimalTemplate>
    );
  }

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <h1>Reset Password</h1>
        <Form
          onSuccess={onSuccess}
          method="POST"
          action={`${serverURL}${api}/${userSlug}/reset-password`}
          redirect={admin}
        >
          <Password
            error="password"
            label="New Password"
            name="password"
            autoComplete="off"
            required
          />
          <ConfirmPassword />
          <HiddenInput
            name="token"
            value={token}
          />
          <FormSubmit>Reset Password</FormSubmit>
        </Form>
      </div>
    </MinimalTemplate>
  );
};

export default ResetPassword;
