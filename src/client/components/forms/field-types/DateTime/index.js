import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

import DatePicker from '../../../elements/DatePicker';
import withCondition from '../../withCondition';
import useFieldType from '../../useFieldType';
import Label from '../../Label';
import Error from '../../Error';
import { date } from '../../../../../fields/validations';

import './index.scss';

const defaultError = 'Please fill in the field with a valid date';

const baseClass = 'date-time-field';

const DateTime = (props) => {
  const {
    path: pathFromProps,
    name,
    required,
    defaultValue,
    initialData,
    validate,
    errorMessage,
    label,
    admin: {
      readOnly,
      style,
      width,
    } = {},
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { required });
    return validationResult;
  }, [validate, required]);

  const {
    value,
    showError,
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
    baseClass,
    showError && `${baseClass}--has-error`,
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
      <div className={`${baseClass}__input-wrapper`}>
        <DatePicker
          {...props}
          onChange={readOnly ? setValue : undefined}
          value={value}
        />
      </div>
    </div>
  );
};

DateTime.defaultProps = {
  label: null,
  required: false,
  defaultValue: undefined,
  initialData: undefined,
  validate: date,
  errorMessage: defaultError,
  admin: {},
  path: '',
};

DateTime.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  defaultValue: PropTypes.string,
  initialData: PropTypes.string,
  validate: PropTypes.func,
  errorMessage: PropTypes.string,
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
    style: PropTypes.shape({}),
    width: PropTypes.string,
  }),
};

export default withCondition(DateTime);
