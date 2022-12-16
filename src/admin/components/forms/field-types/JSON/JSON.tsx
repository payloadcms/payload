import React, { useCallback, useEffect, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import Editor from '@monaco-editor/react';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { json } from '../../../../../fields/validations';
import { Props } from './types';
import useThrottledEffect from '../../../../hooks/useThrottledEffect';

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
    initialValue,
    showError,
    setValue,
    errorMessage,
  } = useField<string>({
    path,
    validate: memoizedValidate,
    condition,
  });

  const [stringValue, setStringValue] = useState<string>();

  useThrottledEffect(() => {
    setValue(JSON.parse(stringValue));
  }, 200, [setValue, stringValue]);

  useEffect(() => {
    setStringValue(JSON.stringify(initialValue, null, 2));
  }, [initialValue]);

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
        value={stringValue}
        onChange={readOnly ? () => null : (val) => setStringValue(val)}
        options={{
          tabSize: 2,
          detectIndentation: true,
          minimap: {
            enabled: false,
          },
        }}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(JSONField);
