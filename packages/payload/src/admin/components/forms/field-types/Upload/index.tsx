import React, { useCallback } from 'react';
import { useConfig } from '../../../utilities/Config/index.js';
import useField from '../../useField/index.js';
import withCondition from '../../withCondition/index.js';
import { upload } from '../../../../../fields/validations.js';
import { Props } from './types.js';
import UploadInput from './Input.js';

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
    path,
    name,
    required,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      condition,
    } = {},
    label,
    validate = upload,
    relationTo,
    fieldTypes,
    filterOptions,
  } = props;

  const collection = collections.find((coll) => coll.slug === relationTo);

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const field = useField({
    path,
    validate: memoizedValidate,
    condition,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = field;

  const onChange = useCallback((incomingValue) => {
    const incomingID = incomingValue?.id || incomingValue;
    setValue(incomingID);
  }, [
    setValue,
  ]);

  if (collection.upload) {
    return (
      <UploadInput
        path={path}
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
        className={className}
        width={width}
        collection={collection}
        fieldTypes={fieldTypes}
        name={name}
        relationTo={relationTo}
        filterOptions={filterOptions}
      />
    );
  }

  return null;
};
export default withCondition(Upload);
