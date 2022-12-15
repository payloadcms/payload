
import React, { useCallback } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import Editor from '@monaco-editor/react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { json } from '../../../../../fields/validations';
import { Props } from './types';

import './index.scss';

const baseClass = 'json-field';

const JSONField: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = json,
    admin: {
      readOnly,
      style,
      className,
      width,
      description,
      condition,
    } = {},
    label,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField<string>({
    path,
    validate: memoizedValidate,
    condition,
  });

  const classes = [
    baseClass,
    'field-type',
    className,
    showError && 'error',
    readOnly && 'read-only',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        showError={showError}
        message={errorMessage}
      />
      <Label
        htmlFor={`field-${path}`}
        label={label}
        required={required}
      />
      <Editor
        height="50vh"
        defaultLanguage="json"
        value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
        onChange={readOnly ? () => null : (val) => setValue(val)}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(JSONField);
