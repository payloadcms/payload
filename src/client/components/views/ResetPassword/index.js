import React from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import config from 'payload/config';
import StatusList from '../../elements/Status';
import Form from '../../forms/Form';
import Password from '../../forms/field-types/Password';
import FormSubmit from '../../forms/Submit';
import Button from '../../elements/Button';
import { useUser } from '../../data/User';

import './index.scss';
import HiddenInput from '../../forms/field-types/HiddenInput';

const baseClass = 'reset-password';

const { admin: { user: userSlug }, serverURL, routes: { admin, api } } = config;

const ResetPassword = () => {
  const { token } = useParams();
  const history = useHistory();
  const { user, setToken } = useUser();

  const handleAjaxResponse = (res) => {
    res.json()
      .then((data) => {
        if (data.token) {
          setToken(data.token);
          history.push(`${admin}`);
        }
      });
  };

  if (user) {
    return (
      <div className={baseClass}>
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
      </div>
    );
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <StatusList />
        <Form
          handleAjaxResponse={handleAjaxResponse}
          method="POST"
          action={`${serverURL}${api}/${userSlug}/reset-password`}
          redirect={admin}
        >
          <Password
            error="password"
            label="Password"
            name="password"
            required
          />
          <HiddenInput
            name="token"
            defaultValue={token}
          />
          <FormSubmit>Reset Password</FormSubmit>
        </Form>
      </div>
    </div>
  );
};

export default ResetPassword;
