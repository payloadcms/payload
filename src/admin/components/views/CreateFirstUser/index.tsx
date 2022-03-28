import React from 'react';
import { useConfig, useAuth } from '@payloadcms/config-provider';
import MinimalTemplate from '../../templates/Minimal';
import Meta from '../../utilities/Meta';
import Form from '../../forms/Form';
import RenderFields from '../../forms/RenderFields';
import fieldTypes from '../../forms/field-types';
import FormSubmit from '../../forms/Submit';
import { Props } from './types';
import { Field } from '../../../../fields/config/types';

import { NegativeFieldGutterProvider } from '../../forms/FieldTypeGutter/context';

import './index.scss';

const baseClass = 'create-first-user';

const CreateFirstUser: React.FC<Props> = (props) => {
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
    }, {
      name: 'confirm-password',
      label: 'Confirm Password',
      type: 'confirmPassword',
      required: true,
    },
  ] as Field[];

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
        method="post"
        redirect={admin}
        action={`${serverURL}${api}/${userSlug}/first-register`}
        validationOperation="create"
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

export default CreateFirstUser;
