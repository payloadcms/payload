import React, { useCallback } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import Editor from '@monaco-editor/react';

import { code } from '../../../../../fields/validations';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import Label from '../../Label';
import { Props } from './types';
import useField from '../../useField';
import { useTheme } from '../../../utilities/Theme';
import withCondition from '../../withCondition';

import './index.scss';

const baseClass = 'code-field';

const Code: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = code,
    admin: {
      readOnly,
      style,
      className,
      width,
      language,
      description,
      condition,
    } = {},
    label,
    editorOptions,
  } = props;

  const { theme } = useTheme();
  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField({
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
        className={`${baseClass}__editor`}
        height="35vh"
        defaultLanguage={language}
        value={value as string || ''}
        onChange={readOnly ? () => null : (val) => setValue(val)}
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
          ...editorOptions,
        }}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(Code);
