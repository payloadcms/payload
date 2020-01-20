import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import FormContext from '../../Form/Context';
import Tooltip from '../../../modules/Tooltip';

import './index.scss';

const baseClass = 'field-type';

const asFieldType = (PassedComponent, type, validate, errors) => {
  const FieldType = (props) => {
    const formContext = useContext(FormContext);

    const {
      name,
      id,
      required,
      initialValue,
      valueOverride,
      onChange,
    } = props;

    const sendField = (valueToSend) => {
      formContext.setValue({
        name,
        value: valueToSend,
        valid: required && validate
          ? validate(valueToSend || '', type)
          : true,
      });
    };

    useEffect(() => {
      let valueToInitialize = initialValue;
      if (valueOverride) valueToInitialize = valueOverride;
      sendField(valueToInitialize);
    }, []);

    useEffect(() => {
      sendField(valueOverride);
    }, [valueOverride]);

    useEffect(() => {
      sendField(initialValue);
    }, [initialValue]);

    const classList = [baseClass, type];
    const valid = formContext.fields[name] ? formContext.fields[name].valid : true;
    const showError = valid === false && formContext.submitted;

    if (showError) classList.push('error');

    let valueToRender = formContext.fields[name] ? formContext.fields[name].value : '';

    // If valueOverride present, field is being controlled by state outside form
    valueToRender = valueOverride || valueToRender;

    const classes = classList.filter(Boolean).join(' ');

    return (
      <PassedComponent
        {...props}
        className={classes}
        value={valueToRender}
        label={(
          <Label
            htmlFor={id || name}
            {...props}
          />
        )}
        error={(
          <Error
            showError={showError}
            type={type}
          />
        )}
        onChange={(e) => {
          sendField(e.target.value);
          if (onChange && typeof onChange === 'function') onChange(e);
        }}
      />
    );
  };

  FieldType.defaultProps = {
    required: false,
    initialValue: '',
    valueOverride: '',
    onChange: null,
    id: '',
  };

  FieldType.propTypes = {
    name: PropTypes.string.isRequired,
    required: PropTypes.bool,
    initialValue: PropTypes.string,
    valueOverride: PropTypes.string,
    onChange: PropTypes.func,
    id: PropTypes.string,
  };

  const Label = (props) => {
    const {
      label, required, htmlFor,
    } = props;

    if (label) {
      return (
        <label htmlFor={htmlFor}>
          {label}
          {required
            && <span className="required">*</span>
          }
        </label>
      );
    }

    return null;
  };

  Label.defaultProps = {
    required: false,
    label: '',
  };

  Label.propTypes = {
    label: PropTypes.string,
    htmlFor: PropTypes.string.isRequired,
    required: PropTypes.bool,
  };

  const Error = (props) => {
    const { error, showError } = props;

    if (showError) {
      return (
        <Tooltip className="error-message">
          {error && errors[error]}
          {!error && errors}
        </Tooltip>
      );
    }

    return null;
  };

  Error.defaultProps = {
    showError: false,
  };

  Error.propTypes = {
    showError: PropTypes.bool,
  };

  return FieldType;
};

export default asFieldType;
