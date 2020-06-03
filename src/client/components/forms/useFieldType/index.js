import { useContext, useCallback, useEffect } from 'react';
import FormContext from '../Form/Context';
import { useLocale } from '../../utilities/Locale';

import './index.scss';

const useFieldType = (options) => {
  const {
    path,
    required,
    defaultValue,
    onChange,
    validate,
  } = options;

  const locale = useLocale();
  const formContext = useContext(FormContext);

  const {
    dispatchFields, submitted, processing, fields,
  } = formContext;

  let mountValue = formContext.fields[path]?.value;

  if (!mountValue && mountValue !== false) mountValue = null;

  const sendField = useCallback((valueToSend) => {
    const fieldToDispatch = { path, value: valueToSend };

    fieldToDispatch.valid = (required && typeof validate === 'function') ? validate(valueToSend || '') : true;

    if (typeof fieldToDispatch.valid === 'string') {
      fieldToDispatch.errorMessage = fieldToDispatch.valid;
      fieldToDispatch.valid = false;
    }

    dispatchFields(fieldToDispatch);
  }, [path, required, dispatchFields, validate]);

  // Send value up to form on mount and when value changes
  useEffect(() => {
    sendField(mountValue);
  }, [sendField, mountValue]);

  useEffect(() => {
    sendField(null);
  }, [locale, sendField]);

  // Remove field from state on "unmount"
  useEffect(() => {
    return () => dispatchFields({ path, type: 'REMOVE' });
  }, [dispatchFields, path]);

  // Send up new value when default is loaded
  // only if it's not null
  useEffect(() => {
    if (defaultValue != null) sendField(defaultValue);
  }, [defaultValue, sendField]);

  const valid = formContext.fields[path] ? formContext.fields[path].valid : true;
  const showError = valid === false && formContext.submitted;

  const valueToRender = formContext.fields[path] ? formContext.fields[path].value : '';


  return {
    ...options,
    showError,
    sendField,
    errorMessage: formContext?.fields[path]?.errorMessage,
    value: valueToRender,
    formSubmitted: submitted,
    formProcessing: processing,
    fields,
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
