import React, { Fragment, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../../../../../../utilities/Config/index.js';
import { useAuth } from '../../../../../../../utilities/Auth/index.js';
import { useFormFields } from '../../../../../../Form/context.js';
import Relationship from '../../../../../Relationship/index.js';
import Select from '../../../../../Select/index.js';

const createOptions = (collections, permissions) => collections.reduce((options, collection) => {
  if (permissions?.collections?.[collection.slug]?.read?.permission && collection?.admin?.enableRichTextRelationship) {
    return [
      ...options,
      {
        label: collection.labels.plural,
        value: collection.slug,
      },
    ];
  }

  return options;
}, []);

const RelationshipFields = () => {
  const { collections } = useConfig();
  const { permissions } = useAuth();
  const { t } = useTranslation('fields');

  const [options, setOptions] = useState(() => createOptions(collections, permissions));
  const relationTo = useFormFields<string>(([fields]) => fields.relationTo?.value as string);

  useEffect(() => {
    setOptions(createOptions(collections, permissions));
  }, [collections, permissions]);

  return (
    <Fragment>
      <Select
        required
        label={t('relationTo')}
        name="relationTo"
        options={options}
      />
      {relationTo && (
        <Relationship
          label={t('relatedDocument')}
          name="value"
          relationTo={relationTo}
          required
        />
      )}
    </Fragment>
  );
};

export default RelationshipFields;
