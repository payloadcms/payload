import React, { useCallback, useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-yaml';
import useField from '../../useField';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import FieldDescription from '../../FieldDescription';
import { code } from '../../../../../fields/validations';
import { Props } from './types';
import { useTheme } from '../../../utilities/Theme';

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
        htmlFor={`field-${path}`}
        label={label}
        required={required}
      />
      <Editor
        className="input"
        id={`field-${path.replace(/\./gi, '__')}`}
        value={value as string || ''}
        onValueChange={readOnly ? () => null : setValue}
        highlight={highlighter}
        padding={25}
        style={{
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
