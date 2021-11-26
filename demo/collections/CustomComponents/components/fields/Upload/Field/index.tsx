import React, { useCallback, useState } from 'react';
import Upload from '../../../../../../../src/admin/components/forms/field-types/Upload';
import { Props as UploadFieldType } from '../../../../../../../src/admin/components/forms/field-types/Upload/types';
import useField from '../../../../../../../src/admin/components/forms/useField';

const Text: React.FC<UploadFieldType> = (props) => {
  const {
    path,
    name,
    label,
    relationTo,
    fieldTypes
  } = props;

  const {
    value,
    setValue
  } = useField({
    path
  });

  const onChange = useCallback((incomingValue) => {
    setValue(incomingValue)
  }, [])

  return (
    <Upload
      relationTo={relationTo}
      fieldTypes={fieldTypes}
      name={name}
      label={label}
      value={value as string}
      onChange={onChange}
    />
  )
};

export default Text;
