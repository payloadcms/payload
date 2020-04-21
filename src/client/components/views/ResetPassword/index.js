import React from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import StatusList from '../../modules/Status';
import ContentBlock from '../../layout/ContentBlock';
import Form from '../../forms/Form';
import Password from '../../forms/field-types/Password';
import FormSubmit from '../../forms/Submit';
import config from '../../../securedConfig';
import Button from '../../controls/Button';
import { useUser } from '../../data/User';

import './index.scss';
import HiddenInput from '../../forms/field-types/HiddenInput';

const baseClass = 'reset-password';

const { serverURL, routes: { admin, api } } = config;

const ResetPassword = () => {
  const { token } = useParams();
  const history = useHistory();
  const { user, setToken } = useUser();

  const handleAjaxResponse = (res) => {
    res.json()
      .then((data) => {
        debugger;
        if (data.token) {
          setToken(data.token);
          history.push(`${admin}`);
        }
      });
  };

  if (user) {
    return (
      <ContentBlock
        className={baseClass}
        width="narrow"
      >
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
            type="secondary"
            to={admin}
          >
            Back to Dashboard
          </Button>
        </div>
      </ContentBlock>
    );
  }

  return (
    <ContentBlock
      className={baseClass}
      width="narrow"
    >
      <div className={`${baseClass}__wrap`}>
        <StatusList />
        <Form
          handleAjaxResponse={handleAjaxResponse}
          method="POST"
          action={`${serverURL}${api}/reset-password`}
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
    </ContentBlock>
  );
};

export default ResetPassword;
