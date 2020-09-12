import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import { code } from '../../../../../fields/validations';

import './index.scss';

const Code = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate,
    admin: {
      readOnly,
      style,
      width,
      language,
    } = {},
    label,
    minLength,
    maxLength,
  } = props;

  const [highlighter] = useState(() => {
    if (languages[language]) {
      return (content) => highlight(content, languages[language]);
    }

    return undefined;
  });

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { minLength, maxLength, required });
    return validationResult;
  }, [validate, maxLength, minLength, required]);

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    enableDebouncedValue: true,
  });

  const classes = [
    'field-type',
    'code',
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
        value={value || ''}
        onValueChange={readOnly ? () => { } : setValue}
        highlight={highlighter}
        padding={25}
        style={{
          backgroundColor: '#333333',
          color: 'white',
          fontFamily: '"Consolas", "Monaco", monospace',
          fontSize: 12,
        }}
      />
    </div>
  );
};

Code.defaultProps = {
  required: false,
  label: null,
  validate: code,
  path: '',
  admin: {},
  minLength: undefined,
  maxLength: undefined,
};

Code.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  required: PropTypes.bool,
  validate: PropTypes.func,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
    language: PropTypes.oneOf(['js', 'json']),
  }),
  label: PropTypes.string,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
};

export default withCondition(Code);
