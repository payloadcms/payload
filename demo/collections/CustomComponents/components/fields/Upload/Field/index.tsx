import { useConfig } from '@payloadcms/config-provider';
import React, { useCallback } from 'react';
import UploadInput from '../../../../../../../src/admin/components/forms/field-types/Upload/Input';
import { Props as UploadFieldType } from '../../../../../../../src/admin/components/forms/field-types/Upload/types';
import useField from '../../../../../../../src/admin/components/forms/useField';
import { SanitizedCollectionConfig } from '../../../../../../../src/collections/config/types';

const Text: React.FC<UploadFieldType> = (props) => {
  const {
    path,
    name,
    label,
    relationTo,
    fieldTypes,
  } = props;

  const {
    value,
    setValue,
    showError,
  } = useField({
    path,
  });

  const onChange = useCallback((incomingValue) => {
    const incomingID = incomingValue?.id || incomingValue;
    setValue(incomingID);
  }, [setValue]);

  const {
    collections,
    serverURL,
    routes: {
      api,
    },
  } = useConfig();

  const collection = collections.find((coll) => coll.slug === relationTo) || undefined;

  return (
    <UploadInput
      path={path}
      relationTo={relationTo}
      fieldTypes={fieldTypes}
      name={name}
      label={label}
      value={value as string}
      onChange={onChange}
      showError={showError}
      collection={collection as SanitizedCollectionConfig}
      serverURL={serverURL}
      api={api}
    />
  );
};

export default Text;
