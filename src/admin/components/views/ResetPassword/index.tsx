import React from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useConfig } from '../../utilities/Config';
import { useAuth } from '../../utilities/Auth';
import MinimalTemplate from '../../templates/Minimal';
import Form from '../../forms/Form';
import Password from '../../forms/field-types/Password';
import ConfirmPassword from '../../forms/field-types/ConfirmPassword';
import FormSubmit from '../../forms/Submit';
import Button from '../../elements/Button';
import Meta from '../../utilities/Meta';


import './index.scss';
import HiddenInput from '../../forms/field-types/HiddenInput';

const baseClass = 'reset-password';

const ResetPassword: React.FC = () => {
  const config = useConfig();
  const { admin: { user: userSlug, logoutRoute }, serverURL, routes: { admin, api } } = config;
  const { token } = useParams<{ token?: string }>();
  const history = useHistory();
  const { user, setToken } = useAuth();

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
            <Link to={`${admin}${logoutRoute}`}>log out</Link>
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
          method="post"
          action={`${serverURL}${api}/${userSlug}/reset-password`}
          redirect={admin}
        >
          <Password
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
