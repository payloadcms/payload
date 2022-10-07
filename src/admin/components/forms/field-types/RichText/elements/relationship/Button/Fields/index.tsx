import React, { Fragment, useState, useEffect } from 'react';
import { useConfig } from '../../../../../../../utilities/Config';
import { useAuth } from '../../../../../../../utilities/Auth';
import { useFormFields } from '../../../../../../Form/context';
import Relationship from '../../../../../Relationship';
import Select from '../../../../../Select';

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

  const [options, setOptions] = useState(() => createOptions(collections, permissions));
  const relationTo = useFormFields<string>(([fields]) => fields.relationTo?.value as string);

  useEffect(() => {
    setOptions(createOptions(collections, permissions));
  }, [collections, permissions]);

  return (
    <Fragment>
      <Select
        required
        label="Relation To"
        name="relationTo"
        options={options}
      />
      {relationTo && (
        <Relationship
          label="Related Document"
          name="value"
          relationTo={relationTo}
          required
        />
      )}
    </Fragment>
  );
};

export default RelationshipFields;
