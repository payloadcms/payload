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
    validate,
    disableFormData,
  } = options;

  // Determine what the initial data is to be used
  // If initialData is defined, that means that data has been provided
  // via the API and should override any default values present.
  // If no initialData, use default value
  const initialData = data !== undefined ? data : defaultValue;

  const locale = useLocale();
  const formContext = useContext(FormContext);
  const {
    dispatchFields, submitted, processing, getField, setModified, modified,
  } = formContext;

  // Maintain an internal initial value AND value to ensure that the form
  // can successfully differentiate between updates sent from fields
  // that are meant to be initial values vs. values that are deliberately changed
  const [internalInitialValue, setInternalInitialValue] = useState(initialData);
  const [internalValue, setInternalValue] = useState(initialData);

  // Debounce internal values to update form state only every 60ms
  const debouncedValue = useDebounce(internalValue, 60);

  // Get field by path
  const field = getField(path);
  const fieldExists = Boolean(field);

  // Valid could be a string equal to an error message
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
    const value = (e && e.target) ? e.target.value : e;

    if (!modified) setModified(true);

    setInternalValue(value);
  }, [setModified, modified]);

  const setInitialValue = useCallback((value) => {
    setInternalInitialValue(value);
  }, []);

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
      setInternalInitialValue(valueFromForm);
    }
  }, [valueFromForm, setInternalInitialValue]);

  // When locale changes, and / or initialData changes,
  // reset internal initial value
  useEffect(() => {
    if (initialData !== undefined) {
      setInternalInitialValue(initialData);
    }
  }, [initialData, setInternalInitialValue, locale]);


  // When internal initial value changes, set internal value
  // This is necessary to bypass changing the form to a modified:true state
  useEffect(() => {
    setInternalValue(internalInitialValue);
  }, [setInternalValue, internalInitialValue]);

  return {
    ...options,
    showError,
    sendField,
    errorMessage: field?.errorMessage,
    value: internalValue,
    formSubmitted: submitted,
    formProcessing: processing,
    setValue,
    setInitialValue,
  };
};

export default useFieldType;
