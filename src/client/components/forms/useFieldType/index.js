import { useContext, useCallback, useEffect } from 'react';
import FormContext from '../Form/Context';
// import { useLocale } from '../../utilities/Locale';

import './index.scss';

const useFieldType = (options) => {
  const {
    path,
    required,
    initialData,
    onChange,
    validate,
  } = options;

  // const locale = useLocale();
  const formContext = useContext(FormContext);

  const {
    dispatchFields, submitted, processing, getFields,
  } = formContext;

  const fields = getFields();

  let mountValue = fields[path]?.value;

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

  const onFieldChange = useCallback((e) => {
    if (e && e.target) {
      sendField(e.target.value);
    } else {
      sendField(e);
    }

    if (onChange && typeof onChange === 'function') onChange(e);
  }, [onChange, sendField]);

  // Send value up to form on mount and when value changes
  useEffect(() => {
    sendField(mountValue);
  }, [sendField, mountValue]);

  // Remove field from state on "unmount"
  useEffect(() => {
    return () => dispatchFields({ path, type: 'REMOVE' });
  }, [dispatchFields, path]);

  // Send up new value when initial data is loaded
  // only if it's not null
  useEffect(() => {
    if (initialData != null) sendField(initialData);
  }, [initialData, sendField]);

  const valid = fields[path] ? fields[path].valid : true;
  const showError = valid === false && submitted;

  const valueToRender = fields[path] ? fields[path].value : '';


  return {
    ...options,
    showError,
    sendField,
    errorMessage: fields[path]?.errorMessage,
    value: valueToRender,
    formSubmitted: submitted,
    formProcessing: processing,
    onFieldChange,
  };
};

export default useFieldType;
