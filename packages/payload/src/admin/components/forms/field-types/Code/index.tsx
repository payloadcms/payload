import React, { useCallback } from 'react';

import { code } from '../../../../../fields/validations';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import Label from '../../Label';
import { Props } from './types';
import useField from '../../useField';
import withCondition from '../../withCondition';
import { CodeEditor } from '../../../elements/CodeEditor';

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
