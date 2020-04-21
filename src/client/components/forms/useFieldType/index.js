import { useContext, useCallback, useEffect } from 'react';
import FormContext from '../Form/Context';
import { useLocale } from '../../utilities/Locale';

import './index.scss';

const useFieldType = (options) => {
  const {
    name,
    required,
    defaultValue,
    onChange,
    validate,
  } = options;

  const locale = useLocale();
  const formContext = useContext(FormContext);
  const { dispatchFields, submitted, processing } = formContext;
  const mountValue = formContext.fields[name]?.value || null;

  const sendField = useCallback((valueToSend) => {
    dispatchFields({
      name,
      value: valueToSend,
      valid: required && validate
        ? validate(valueToSend || '')
        : true,
    });
  }, [name, required, dispatchFields, validate]);

  // Send value up to form on mount and when value changes
  useEffect(() => {
    sendField(mountValue);
  }, [sendField, mountValue]);

  // Remove field from state on "unmount"
  useEffect(() => {
    return () => dispatchFields({ name, type: 'REMOVE' });
  }, [dispatchFields, name]);

  // Send up new value when default is loaded
  // only if it's not null
  useEffect(() => {
    if (defaultValue != null) sendField(defaultValue);
  }, [defaultValue, sendField]);

  useEffect(() => {
    sendField(null);
  }, [locale, sendField]);

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
