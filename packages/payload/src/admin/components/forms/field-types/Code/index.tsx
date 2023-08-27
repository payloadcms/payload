import React, { useCallback } from 'react';

import { code } from '../../../../../fields/validations.js';
import Error from '../../Error/index.js';
import FieldDescription from '../../FieldDescription/index.js';
import Label from '../../Label/index.js';
import { Props } from './types.js';
import useField from '../../useField/index.js';
import withCondition from '../../withCondition/index.js';
import { CodeEditor } from '../../../elements/CodeEditor/index.js';

import './index.scss';

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
};

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
      editorOptions,
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
      <CodeEditor
        options={editorOptions}
        defaultLanguage={prismToMonacoLanguageMap[language] || language}
        value={value as string || ''}
        onChange={readOnly ? () => null : (val) => setValue(val)}
        readOnly={readOnly}
      />
      <FieldDescription
        value={value}
        description={description}
      />
    </div>
  );
};

export default withCondition(Code);
