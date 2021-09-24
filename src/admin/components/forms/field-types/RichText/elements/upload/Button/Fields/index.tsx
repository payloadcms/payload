import React, { Fragment, useState, useEffect } from 'react';
import { useConfig, useAuth } from '@payloadcms/config-provider';
import { useWatchForm } from '../../../../../../Form/context';
import Relationship from '../../../../../Relationship';
import Select from '../../../../../Select';

const createOptions = (collections, permissions) => collections.reduce((options, collection) => {
  if (permissions?.collections?.[collection.slug]?.read?.permission && collection?.admin?.enableRichTextRelationship && collection.upload) {
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

const UploadFields = () => {
  const { collections } = useConfig();
  const { permissions } = useAuth();

  const [options, setOptions] = useState(() => createOptions(collections, permissions));

  const { getData } = useWatchForm();
  const { relationTo } = getData();

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
          label="Upload"
          name="value"
          relationTo={relationTo}
          required
        />
      )}
    </Fragment>
  );
};

export default UploadFields;
