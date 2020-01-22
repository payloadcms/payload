import { useContext, useCallback, useEffect } from 'react';
import FormContext from '../Form/Context';
import useMountEffect from '../../../hooks/useMountEffect';

import './index.scss';

const useFieldType = (options) => {
  const formContext = useContext(FormContext);
  const { setField, submitted, processing } = formContext;

  const {
    name,
    required,
    defaultValue,
    valueOverride,
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

  useMountEffect(() => {
    let valueToInitialize = defaultValue;
    if (valueOverride) valueToInitialize = valueOverride;
    sendField(valueToInitialize);
  });

  useEffect(() => {
    sendField(defaultValue);
  }, [defaultValue, sendField]);

  useEffect(() => {
    sendField(valueOverride);
  }, [valueOverride, sendField]);

  const valid = formContext.fields[name] ? formContext.fields[name].valid : true;
  const showError = valid === false && formContext.submitted;

  let valueToRender = formContext.fields[name] ? formContext.fields[name].value : '';
  valueToRender = valueOverride || valueToRender;

  return {
    ...options,
    showError,
    sendField,
    value: valueToRender,
    formSubmitted: submitted,
    formProcessing: processing,
    onChange: (e) => {
      if (e.target) {
        sendField(e.target.value);
      } else {
        sendField(e);
      }

      if (onChange && typeof onChange === 'function') onChange(e);
    },
  };
};

export default useFieldType;
