import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import useFieldType from '../../useFieldType';
import withCondition from '../../withCondition';
import Error from '../../Error';
import Label from '../../Label';
import RadioInput from './RadioInput';
import { radio } from '../../../../../validation/validations';

import './index.scss';

const RadioGroup = (props) => {
  const {
    name,
    path: pathFromProps,
    required,
    defaultValue,
    initialData,
    validate,
    style,
    width,
    label,
    readOnly,
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
    initialData,
    defaultValue,
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
        const isSelected = !value ? (option.value === defaultValue) : (option.value === value);

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
  readOnly: false,
  defaultValue: null,
  initialData: undefined,
  validate: radio,
  width: undefined,
  style: {},
  path: '',
};

RadioGroup.propTypes = {
  path: PropTypes.string,
  name: PropTypes.string.isRequired,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  initialData: PropTypes.string,
  validate: PropTypes.func,
  width: PropTypes.string,
  style: PropTypes.shape({}),
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    }),
  ).isRequired,
};

export default withCondition(RadioGroup);
