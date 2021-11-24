import {
  useCallback, useEffect, useState,
} from 'react';
import { useFormProcessing, useFormSubmitted, useFormModified, useForm } from '../Form/context';
import useDebounce from '../../../hooks/useDebounce';
import { Options, FieldType } from './types';

const useFieldType = <T extends unknown>(options: Options): FieldType<T> => {
  const {
    path,
    validate,
    enableDebouncedValue,
    disableFormData,
    ignoreWhileFlattening,
    stringify,
    condition,
  } = options;

  const formContext = useForm();
  const submitted = useFormSubmitted();
  const processing = useFormProcessing();
  const modified = useFormModified();

  const {
    dispatchFields,
    getField,
    setModified,
  } = formContext || {};

  const [internalValue, setInternalValue] = useState(undefined);

  // Debounce internal values to update form state only every 60ms
  const debouncedValue = useDebounce(internalValue, 120);

  // Get field by path
  const field = getField(path);

  const initialValue = field?.initialValue;

  // Valid could be a string equal to an error message
  const valid = (field && typeof field.valid === 'boolean') ? field.valid : true;
  const showError = valid === false && submitted;

  // Method to send update field values from field component(s)
  // Should only be used internally
  const sendField = useCallback(async (valueToSend) => {
    const fieldToDispatch = {
      path,
      stringify,
      disableFormData,
      ignoreWhileFlattening,
      initialValue,
      validate,
      condition,
      value: valueToSend,
      valid: false,
      errorMessage: undefined,
    };

    const validationResult = typeof validate === 'function' ? await validate(valueToSend) : true;

    if (typeof validationResult === 'string') {
      fieldToDispatch.errorMessage = validationResult;
      fieldToDispatch.valid = false;
    } else {
      fieldToDispatch.valid = validationResult;
    }

    if (typeof dispatchFields === 'function') {
      dispatchFields(fieldToDispatch);
    }
  }, [
    path,
    dispatchFields,
    validate,
    disableFormData,
    ignoreWhileFlattening,
    initialValue,
    stringify,
    condition
  ]);

  // Method to return from `useFieldType`, used to
  // update internal field values from field component(s)
  // as fast as they arrive. NOTE - this method is NOT debounced
  const setValue = useCallback((e, modifyForm = true) => {
    const val = (e && e.target) ? e.target.value : e;

    if ((!ignoreWhileFlattening && !modified) && modifyForm) {
      if (typeof setModified === 'function') {
        setModified(true);
      }
    }

    setInternalValue(val);
  }, [
    setModified,
    modified,
    ignoreWhileFlattening
  ]);

  useEffect(() => {
    setInternalValue(initialValue);
  }, [initialValue]);

  // The only time that the FORM value should be updated
  // is when the debounced value updates. So, when the debounced value updates,
  // send it up to the form

  const valueToSend = enableDebouncedValue ? debouncedValue : internalValue;

  useEffect(() => {
    if (field?.value !== valueToSend && valueToSend !== undefined) {
      sendField(valueToSend);
    }
  }, [
    valueToSend,
    sendField,
    field
  ]);

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
