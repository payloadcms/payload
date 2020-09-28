import {
  useCallback, useEffect, useState,
} from 'react';
import { useFormProcessing, useFormSubmitted, useFormModified, useForm } from '../Form/context';
import useDebounce from '../../../hooks/useDebounce';

import './index.scss';

const useFieldType = (options) => {
  const {
    path,
    validate,
    enableDebouncedValue,
    disableFormData,
    ignoreWhileFlattening,
    stringify,
  } = options;

  const formContext = useForm();
  const submitted = useFormSubmitted();
  const processing = useFormProcessing();
  const modified = useFormModified();

  const {
    dispatchFields, getField, setModified,
  } = formContext;

  const [internalValue, setInternalValue] = useState(undefined);

  // Debounce internal values to update form state only every 60ms
  const debouncedValue = useDebounce(internalValue, 120);

  // Get field by path
  const field = getField(path);
  const fieldExists = Boolean(field);

  const initialValue = field?.initialValue;

  // Valid could be a string equal to an error message
  const valid = (field && typeof field.valid === 'boolean') ? field.valid : true;
  const showError = valid === false && submitted;

  // Method to send update field values from field component(s)
  // Should only be used internally
  const sendField = useCallback(async (valueToSend) => {
    const fieldToDispatch = { path, value: valueToSend };

    fieldToDispatch.valid = typeof validate === 'function' ? await validate(valueToSend) : true;

    if (typeof fieldToDispatch.valid === 'string') {
      fieldToDispatch.errorMessage = fieldToDispatch.valid;
      fieldToDispatch.valid = false;
    }

    fieldToDispatch.stringify = stringify;
    fieldToDispatch.disableFormData = disableFormData;
    fieldToDispatch.ignoreWhileFlattening = ignoreWhileFlattening;
    fieldToDispatch.initialValue = initialValue;

    dispatchFields(fieldToDispatch);
  }, [path, dispatchFields, validate, disableFormData, ignoreWhileFlattening, initialValue, stringify]);

  // Method to return from `useFieldType`, used to
  // update internal field values from field component(s)
  // as fast as they arrive. NOTE - this method is NOT debounced
  const setValue = useCallback((e) => {
    const val = (e && e.target) ? e.target.value : e;

    if (!ignoreWhileFlattening && !modified) {
      setModified(true);
    }

    setInternalValue(val);
  }, [setModified, modified, ignoreWhileFlattening]);

  useEffect(() => {
    setInternalValue(initialValue);
  }, [initialValue]);

  // The only time that the FORM value should be updated
  // is when the debounced value updates. So, when the debounced value updates,
  // send it up to the form

  const valueToSend = enableDebouncedValue ? debouncedValue : internalValue;

  useEffect(() => {
    if (valueToSend !== undefined || !fieldExists) {
      sendField(valueToSend);
    }
  }, [valueToSend, sendField, fieldExists]);

  return {
    ...options,
    showError,
    errorMessage: field?.errorMessage,
    value: internalValue,
    formSubmitted: submitted,
    formProcessing: processing,
    setValue,
  };
};

export default useFieldType;
