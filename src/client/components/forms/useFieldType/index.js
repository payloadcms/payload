import {
  useContext, useCallback, useEffect, useState,
} from 'react';
import FormContext from '../Form/Context';
import { useLocale } from '../../utilities/Locale';
import useDebounce from '../../../hooks/useDebounce';

import './index.scss';

const useFieldType = (options) => {
  const {
    path,
    required,
    initialData: data,
    defaultValue,
    onChange,
    validate,
    disableFormData,
  } = options;

  const initialData = data !== undefined ? data : defaultValue;
  const locale = useLocale();
  const formContext = useContext(FormContext);
  const [internalValue, setInternalValue] = useState(initialData);
  const debouncedValue = useDebounce(internalValue, 100);

  const {
    dispatchFields, submitted, processing, getField,
  } = formContext;

  const field = getField(path);
  const fieldExists = Boolean(field);
  const valid = (field && typeof field.valid === 'boolean') ? field.valid : true;
  const valueFromForm = field?.value;
  const showError = valid === false && submitted;

  // Method to send update field values from field component(s)
  // Should only be used internally
  const sendField = useCallback(async (valueToSend) => {
    const fieldToDispatch = { path, value: valueToSend };

    fieldToDispatch.valid = (required && typeof validate === 'function') ? await validate(valueToSend || '') : true;

    if (typeof fieldToDispatch.valid === 'string') {
      fieldToDispatch.errorMessage = fieldToDispatch.valid;
      fieldToDispatch.valid = false;
    }

    if (disableFormData) {
      fieldToDispatch.disableFormData = true;
    }

    dispatchFields(fieldToDispatch);
  }, [path, required, dispatchFields, validate, disableFormData]);


  // Method to return from `useFieldType`, used to
  // update internal field values from field component(s)
  // as fast as they arrive. NOTE - this method is NOT debounced
  const setValue = useCallback((e) => {
    if (e && e.target) {
      setInternalValue(e.target.value);
    } else {
      setInternalValue(e);
    }

    if (onChange && typeof onChange === 'function') onChange(e);
  }, [onChange, setInternalValue]);

  // Remove field from state on "unmount"
  // This is mostly used for repeater / flex content row modifications
  useEffect(() => {
    return () => dispatchFields({ path, type: 'REMOVE' });
  }, [dispatchFields, path]);

  // The only time that the form value should be updated
  // is when the debounced value updates. So, when the debounced value updates,
  // send it up to the form
  useEffect(() => {
    if (!fieldExists || debouncedValue !== undefined) {
      sendField(debouncedValue);
    }
  }, [debouncedValue, sendField, fieldExists]);

  // Whenever the value from form updates,
  // update internal value as well
  useEffect(() => {
    if (valueFromForm !== undefined) {
      setValue(valueFromForm);
    }
  }, [valueFromForm, setValue]);

  useEffect(() => {
    if (initialData !== undefined) {
      setValue(initialData);
    }
  }, [initialData, setValue, locale]);

  return {
    ...options,
    showError,
    sendField,
    errorMessage: field?.errorMessage,
    value: internalValue,
    formSubmitted: submitted,
    formProcessing: processing,
    setValue,
  };
};

export default useFieldType;
