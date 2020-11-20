import React from 'react';
import PropTypes from 'prop-types';
import { useConfig } from '../../providers/Config';
import MinimalTemplate from '../../templates/Minimal';
import Meta from '../../utilities/Meta';
import Form from '../../forms/Form';
import RenderFields from '../../forms/RenderFields';
import fieldTypes from '../../forms/field-types';
import FormSubmit from '../../forms/Submit';
import { useAuth } from '../../providers/Authentication';
import { NegativeFieldGutterProvider } from '../../forms/FieldTypeGutter/context';

import './index.scss';

const baseClass = 'create-first-user';

const CreateFirstUser = (props) => {
  const { setInitialized } = props;
  const { setToken } = useAuth();
  const {
    admin: { user: userSlug }, collections, serverURL, routes: { admin, api },
  } = useConfig();

  const userConfig = collections.find((collection) => collection.slug === userSlug);

  const onSuccess = (json) => {
    if (json?.user?.token) {
      setToken(json.user.token);
    }

    setInitialized(true);
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
      <h1>Welcome</h1>
      <p>To begin, create your first user.</p>
      <Meta
        title="Create First User"
        description="Create first user"
        keywords="Create, Payload, CMS"
      />
      <Form
        onSuccess={onSuccess}
        method="POST"
        redirect={admin}
        action={`${serverURL}${api}/${userSlug}/first-register`}
      >
        <NegativeFieldGutterProvider allow>
          <RenderFields
            fieldSchema={[
              ...fields,
              ...userConfig.fields,
            ]}
            fieldTypes={fieldTypes}
          />
        </NegativeFieldGutterProvider>
        <FormSubmit>Create</FormSubmit>
      </Form>
    </MinimalTemplate>
  );
};

CreateFirstUser.propTypes = {
  setInitialized: PropTypes.func.isRequired,
};

export default CreateFirstUser;
