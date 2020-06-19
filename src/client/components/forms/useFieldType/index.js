import {
  useContext, useCallback, useEffect, useState,
} from 'react';
import FormContext from '../Form/Context';
import useDebounce from '../../../hooks/useDebounce';

import './index.scss';

const useFieldType = (options) => {
  const {
    path,
    initialData: data,
    defaultValue,
    validate,
    disableFormData,
    enableDebouncedValue,
  } = options;

  // Determine what the initial data is to be used
  // If initialData is defined, that means that data has been provided
  // via the API and should override any default values present.
  // If no initialData, use default value
  const initialData = data !== undefined ? data : defaultValue;

  const formContext = useContext(FormContext);
  const {
    dispatchFields, submitted, processing, getField, setModified, modified,
  } = formContext;

  const [internalValue, setInternalValue] = useState(initialData);

  // Debounce internal values to update form state only every 60ms
  const debouncedValue = useDebounce(internalValue, 120);

  // Get field by path
  const field = getField(path);

  // Valid could be a string equal to an error message
  const valid = (field && typeof field.valid === 'boolean') ? field.valid : true;
  const showError = valid === false && submitted;

  // Method to send update field values from field component(s)
  // Should only be used internally
  const sendField = useCallback(async (valueToSend) => {
    const fieldToDispatch = { path, value: valueToSend };

    fieldToDispatch.valid = typeof validate === 'function' ? await validate(valueToSend || '') : true;

    if (typeof fieldToDispatch.valid === 'string') {
      fieldToDispatch.errorMessage = fieldToDispatch.valid;
      fieldToDispatch.valid = false;
    }

    if (disableFormData) {
      fieldToDispatch.disableFormData = true;
    }

    dispatchFields(fieldToDispatch);
  }, [path, dispatchFields, validate, disableFormData]);


  // Method to return from `useFieldType`, used to
  // update internal field values from field component(s)
  // as fast as they arrive. NOTE - this method is NOT debounced
  const setValue = useCallback((e) => {
    const value = (e && e.target) ? e.target.value : e;

    if (!modified) setModified(true);

    setInternalValue(value);
  }, [setModified, modified]);

  // Remove field from state on "unmount"
  // This is mostly used for repeater / flex content row modifications
  useEffect(() => {
    return () => dispatchFields({ path, type: 'REMOVE' });
  }, [dispatchFields, path]);

  // The only time that the FORM value should be updated
  // is when the debounced value updates. So, when the debounced value updates,
  // send it up to the form

  const formValue = enableDebouncedValue ? debouncedValue : internalValue;

  useEffect(() => {
    if (formValue !== undefined) {
      sendField(formValue);
    }
  }, [formValue, sendField]);

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
