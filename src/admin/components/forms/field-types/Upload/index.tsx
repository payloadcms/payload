import React, { useCallback } from 'react';
import { useConfig } from '@payloadcms/config-provider';
import useField from '../../useField';
import withCondition from '../../withCondition';
import { upload } from '../../../../../fields/validations';
import { Props } from './types';
import UploadInput from './Input';

import './index.scss';

const Upload: React.FC<Props> = (props) => {
  const {
    collections,
    serverURL,
    routes: {
      api,
    },
  } = useConfig();

  const {
    path: pathFromProps,
    name,
    required,
    admin: {
      readOnly,
      style,
      width,
      description,
      condition,
    } = {},
    label,
    validate = upload,
    relationTo,
    fieldTypes,
  } = props;

  const collection = collections.find((coll) => coll.slug === relationTo);

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const fieldType = useField({
    path,
    validate: memoizedValidate,
    condition,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const onChange = useCallback((incomingValue) => {
    const incomingID = incomingValue?.id || incomingValue;
    setValue(incomingID);
  }, [
    setValue,
  ]);

  if (collection.upload) {
    return (
      <UploadInput
        value={value as string}
        onChange={onChange}
        description={description}
        label={label}
        required={required}
        showError={showError}
        serverURL={serverURL}
        api={api}
        errorMessage={errorMessage}
        readOnly={readOnly}
        style={style}
        width={width}
        collection={collection}
        fieldTypes={fieldTypes}
        name={name}
        relationTo={relationTo}
      />
    );
  }

  return null;
};
export default withCondition(Upload);
