import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Error from '../../Error';
import Label from '../../Label';
import RadioInput from './RadioInput';
import { radio } from '../../../../../fields/validations';

import './index.scss';

const RadioGroup = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    validate,
    label,
    admin: {
      readOnly,
      style,
      width,
    } = {},
    options,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const {
    value,
    showError,
    errorMessage,
    setValue,
  } = useFieldType({
    path,
    required,
    validate: memoizedValidate,
  });

  const classes = [
    'field-type',
    'radio-group',
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
      {options?.map((option) => {
        const isSelected = option.value === value;

        return (
          <RadioInput
            key={option.value}
            isSelected={isSelected}
            option={option}
            onChange={readOnly ? undefined : setValue}
          />
        );
      })}
    </div>
  );
};

RadioGroup.defaultProps = {
  label: null,
  required: false,
  validate: radio,
  admin: {},
  path: '',
};

RadioGroup.propTypes = {
  path: PropTypes.string,
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  validate: PropTypes.func,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
  }),
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    }),
  ).isRequired,
};

export default withCondition(RadioGroup);
