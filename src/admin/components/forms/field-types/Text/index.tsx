import React from 'react';
import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Label from '../../Label';
import Error from '../../Error';
import { text } from '../../../../../fields/validations';
import { Props } from './types';
import RenderFieldDescription from '../../RenderFieldDescription';

import './index.scss';

const Text: React.FC<Props> = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    validate = text,
    label,
    admin: {
      placeholder,
      readOnly,
      style,
      width,
      condition,
      description,
      components: {
        Description,
      } = {},
    } = {},
  } = props;

  const path = pathFromProps || name;

  const fieldType = useFieldType<string>({
    path,
    validate,
    condition,
    enableDebouncedValue: true,
  });

  const {
    value,
    showError,
    setValue,
    errorMessage,
  } = fieldType;

  const classes = [
    'field-type',
    'text',
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
      <input
        value={value || ''}
        onChange={setValue}
        disabled={readOnly}
        placeholder={placeholder}
        type="text"
        id={path}
        name={path}
      />
      <RenderFieldDescription
        value={value || ''}
        description={description}
        CustomComponent={Description}
      />
    </div>
  );
};

export default withCondition(Text);
