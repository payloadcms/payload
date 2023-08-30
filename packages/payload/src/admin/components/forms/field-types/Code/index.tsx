import React, { useCallback } from 'react';

import type { Props } from './types.js';

import { code } from '../../../../../fields/validations.js';
import { CodeEditor } from '../../../elements/CodeEditor/index.js';
import Error from '../../Error/index.js';
import FieldDescription from '../../FieldDescription/index.js';
import Label from '../../Label/index.js';
import useField from '../../useField/index.js';
import withCondition from '../../withCondition/index.js';
import './index.scss';

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
};

const baseClass = 'code-field';

const Code: React.FC<Props> = (props) => {
  const {
    admin: {
      className,
      condition,
      description,
      editorOptions,
      language,
      readOnly,
      style,
      width,
    } = {},
    label,
    name,
    path: pathFromProps,
    required,
    validate = code,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, required });
  }, [validate, required]);

  const {
    errorMessage,
    setValue,
    showError,
    value,
  } = useField({
    condition,
    path,
    validate: memoizedValidate,
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
      style={{
        ...style,
        width,
      }}
      className={classes}
    >
      <Error
        message={errorMessage}
        showError={showError}
      />
      <Label
        htmlFor={`field-${path}`}
        label={label}
        required={required}
      />
      <CodeEditor
        defaultLanguage={prismToMonacoLanguageMap[language] || language}
        onChange={readOnly ? () => null : (val) => setValue(val)}
        options={editorOptions}
        readOnly={readOnly}
        value={value as string || ''}
      />
      <FieldDescription
        description={description}
        value={value}
      />
    </div>
  );
};

export default withCondition(Code);
