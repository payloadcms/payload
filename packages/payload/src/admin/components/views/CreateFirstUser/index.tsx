import React from 'react';
import { useTranslation } from 'react-i18next';

import type { Field } from '../../../../fields/config/types.js';
import type { Props } from './types.js';

import Form from '../../forms/Form/index.js';
import RenderFields from '../../forms/RenderFields/index.js';
import FormSubmit from '../../forms/Submit/index.js';
import fieldTypes from '../../forms/field-types/index.js';
import MinimalTemplate from '../../templates/Minimal/index.js';
import { useAuth } from '../../utilities/Auth/index.js';
import { useConfig } from '../../utilities/Config/index.js';
import Meta from '../../utilities/Meta/index.js';
import './index.scss';

const baseClass = 'create-first-user';

const CreateFirstUser: React.FC<Props> = (props) => {
  const { setInitialized } = props;
  const { setToken } = useAuth();
  const {
    admin: { user: userSlug }, collections, routes: { admin, api }, serverURL,
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
      label: t('general:emailAddress'),
      name: 'email',
      required: true,
      type: 'email',
    }, {
      label: t('general:password'),
      name: 'password',
      required: true,
      type: 'password',
    }, {
      label: t('confirmPassword'),
      name: 'confirm-password',
      required: true,
      type: 'confirmPassword',
    },
  ] as Field[];

  return (
    <MinimalTemplate className={baseClass}>
      <h1>{t('general:welcome')}</h1>
      <p>{t('beginCreateFirstUser')}</p>
      <Meta
        description={t('createFirstUser')}
        keywords={t('general:create')}
        title={t('createFirstUser')}
      />
      <Form
        action={`${serverURL}${api}/${userSlug}/first-register`}
        method="post"
        onSuccess={onSuccess}
        redirect={admin}
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
