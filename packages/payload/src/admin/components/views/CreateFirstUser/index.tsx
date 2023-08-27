import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config.js';
import { useAuth } from '../../utilities/Auth.js';
import MinimalTemplate from '../../templates/Minimal.js';
import Meta from '../../utilities/Meta.js';
import Form from '../../forms/Form.js';
import RenderFields from '../../forms/RenderFields.js';
import fieldTypes from '../../forms/field-types.js';
import FormSubmit from '../../forms/Submit.js';
import { Props } from './types.js';
import { Field } from '../../../../fields/config/types.js';

import './index.scss';

const baseClass = 'create-first-user';

const CreateFirstUser: React.FC<Props> = (props) => {
  const { setInitialized } = props;
  const { setToken } = useAuth();
  const {
    admin: { user: userSlug }, collections, serverURL, routes: { admin, api },
  } = useConfig();
  const { t } = useTranslation('authentication');

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
      label: t('general:emailAddress'),
      type: 'email',
      required: true,
    }, {
      name: 'password',
      label: t('general:password'),
      type: 'password',
      required: true,
    }, {
      name: 'confirm-password',
      label: t('confirmPassword'),
      type: 'confirmPassword',
      required: true,
    },
  ] as Field[];

  return (
    <MinimalTemplate className={baseClass}>
      <h1>{t('general:welcome')}</h1>
      <p>{t('beginCreateFirstUser')}</p>
      <Meta
        title={t('createFirstUser')}
        description={t('createFirstUser')}
        keywords={t('general:create')}
      />
      <Form
        onSuccess={onSuccess}
        method="post"
        redirect={admin}
        action={`${serverURL}${api}/${userSlug}/first-register`}
        validationOperation="create"
      >
        <RenderFields
          fieldSchema={[
            ...fields,
            ...userConfig.fields,
          ]}
          fieldTypes={fieldTypes}
        />
        <FormSubmit>{t('general:create')}</FormSubmit>
      </Form>
    </MinimalTemplate>
  );
};

export default CreateFirstUser;
