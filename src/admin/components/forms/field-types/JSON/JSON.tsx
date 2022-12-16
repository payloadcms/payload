import React, { useCallback, useEffect, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import Editor from '@monaco-editor/react';

import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { json } from '../../../../../fields/validations';
import Label from '../../Label';
import { Props } from './types';
import useField from '../../useField';
import useThrottledEffect from '../../../../hooks/useThrottledEffect';
import { useTheme } from '../../../utilities/Theme';
import withCondition from '../../withCondition';

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

  const { theme } = useTheme();
  const path = pathFromProps || name;
  const [stringValue, setStringValue] = useState<string>();
  const [jsonError, setJsonError] = useState<string>();

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required, jsonError });
  }, [validate, required, jsonError]);

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

  useThrottledEffect(() => {
    try {
      setValue(JSON.parse(stringValue));
      setJsonError(undefined);
    } catch (e) {
      setJsonError(e);
    }
  }, 0, [setValue, stringValue]);

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
        className={`${baseClass}__editor`}
        height="35vh"
        defaultLanguage="json"
        value={stringValue}
        onChange={readOnly ? () => null : (val) => setStringValue(val)}
        options={{
          detectIndentation: true,
          minimap: {
            enabled: false,
          },
          readOnly: Boolean(readOnly),
          scrollBeyondLastLine: false,
          tabSize: 2,
          theme: theme === 'dark' ? 'vs-dark' : 'vs',
          wordWrap: 'on',
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
