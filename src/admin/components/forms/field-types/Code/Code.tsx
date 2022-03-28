import React, { useCallback, useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { code } from '../../../../../fields/validations';
import { Props } from './types';

import './index.scss';

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
  } = props;

  const [highlighter] = useState(() => {
    if (languages[language]) {
      return (content) => highlight(content, languages[language]);
    }

    return (content) => content;
  });

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, options);
  }, [validate]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useField({
    path,
    validate: memoizedValidate,
    enableDebouncedValue: true,
    condition,
  });

  const classes = [
    'field-type',
    'code',
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
        htmlFor={path}
        label={label}
        required={required}
      />
      <Editor
        value={value as string || ''}
        onValueChange={readOnly ? () => null : setValue}
        highlight={highlighter}
        padding={25}
        style={{
          backgroundColor: '#333333',
          color: 'white',
          fontFamily: '"Consolas", "Monaco", monospace',
          fontSize: 12,
          pointerEvents: readOnly ? 'none' : 'auto',
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
