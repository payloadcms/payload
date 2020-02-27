import { useContext, useCallback, useEffect } from 'react';
import FormContext from '../Form/Context';

import './index.scss';

const useFieldType = (options) => {
  const formContext = useContext(FormContext);
  const { setField, submitted, processing } = formContext;

  const {
    name,
    required,
    defaultValue,
    onChange,
    validate,
  } = options;

  const sendField = useCallback((valueToSend) => {
    setField({
      name,
      value: valueToSend,
      valid: required && validate
        ? validate(valueToSend || '')
        : true,
    });
  }, [name, required, setField, validate]);

  useEffect(() => {
    sendField(defaultValue);
  }, [defaultValue, sendField]);

  const valid = formContext.fields[name] ? formContext.fields[name].valid : true;
  const showError = valid === false && formContext.submitted;

  const valueToRender = formContext.fields[name] ? formContext.fields[name].value : '';

  return {
    ...options,
    showError,
    sendField,
    value: valueToRender,
    formSubmitted: submitted,
    formProcessing: processing,
    onFieldChange: (e) => {
      if (e && e.target) {
        sendField(e.target.value);
      } else {
        sendField(e);
      }

      if (onChange && typeof onChange === 'function') onChange(e);
    },
  };
};

export default useFieldType;
