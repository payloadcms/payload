import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import config from 'payload/config';
import MinimalTemplate from '../../templates/Minimal';
import StatusList, { useStatusList } from '../../elements/Status';
import Form from '../../forms/Form';
import RenderFields from '../../forms/RenderFields';
import * as fieldTypes from '../../forms/field-types';
import FormSubmit from '../../forms/Submit';
import { useUser } from '../../data/User';

import './index.scss';

const {
  admin: { user: userSlug }, collections, serverURL, routes: { admin, api },
} = config;

const userConfig = collections.find(collection => collection.slug === userSlug);

const baseClass = 'create-first-user';

const CreateFirstUser = (props) => {
  const { setInitialized } = props;
  const { addStatus } = useStatusList();
  const { setCookieToken } = useUser();
  const history = useHistory();

  const handleAjaxResponse = (res) => {
    res.json().then((data) => {
      if (data.token) {
        setToken(data.token);
        setInitialized(true);
        history.push(`${admin}`);
      } else {
        addStatus({
          type: 'error',
          message: 'There was a problem creating your first user.',
        });
      }
    });
  };

  const fields = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
    }, {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
    },
  ];

  return (
    <MinimalTemplate className={baseClass}>
      <h1>Welcome to Payload</h1>
      <p>To begin, create your first user.</p>
      <StatusList />
      <Form
        handleAjaxResponse={handleAjaxResponse}
        disableSuccessStatus
        method="POST"
        action={`${serverURL}${api}/${userSlug}/first-register`}
      >
        <RenderFields
          fieldSchema={[
            ...fields,
            ...userConfig.fields,
          ]}
          fieldTypes={fieldTypes}
        />
        <FormSubmit>Create</FormSubmit>
      </Form>
    </MinimalTemplate>
  );
};

CreateFirstUser.propTypes = {
  setInitialized: PropTypes.func.isRequired,
};

export default CreateFirstUser;
