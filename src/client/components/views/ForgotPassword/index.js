import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusList, { useStatusList } from '../../modules/Status';
import ContentBlock from '../../layout/ContentBlock';
import Form from '../../forms/Form';
import Email from '../../forms/field-types/Email';
import FormSubmit from '../../forms/Submit';
import config from '../../../securedConfig';
import Button from '../../controls/Button';
import { useUser } from '../../data/User';

import './index.scss';

const baseClass = 'forgot-password';

const { serverURL, routes: { admin, api } } = config;

const ForgotPassword = () => {
  const { addStatus } = useStatusList();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { user } = useUser();

  const handleAjaxResponse = (res) => {
    res.json()
      .then(() => {
        setHasSubmitted(true);
      }, () => {
        addStatus({
          type: 'error',
          message: 'The email provided is not valid.',
        });
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

  if (hasSubmitted) {
    return (
      <ContentBlock
        className={baseClass}
        width="narrow"
      >
        <div className={`${baseClass}__wrap`}>
          <h1>Email sent</h1>
          <p>
            Check your email for a link that will allow you to securely reset your password.
          </p>
          <br />
          <Button
            el="link"
            type="secondary"
            to={`${admin}/login`}
          >
            Go to login
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
          novalidate
          handleAjaxResponse={handleAjaxResponse}
          method="POST"
          action={`${serverURL}${api}/forgot-password`}
        >
          <Email
            label="Email Address"
            name="email"
            required
          />
          <FormSubmit>Submit</FormSubmit>
        </Form>
      </div>
    </ContentBlock>
  );
};

export default ForgotPassword;
