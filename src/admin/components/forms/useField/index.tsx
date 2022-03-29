import {
  useCallback, useEffect, useState,
} from 'react';
import { useAuth } from '@payloadcms/config-provider';
import { useFormProcessing, useFormSubmitted, useFormModified, useForm } from '../Form/context';
import useDebounce from '../../../hooks/useDebounce';
import { Options, FieldType } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useOperation } from '../../utilities/OperationProvider';

const useField = <T extends unknown>(options: Options): FieldType<T> => {
  const {
    path,
    validate,
    enableDebouncedValue,
    disableFormData,
    ignoreWhileFlattening,
    condition,
  } = options;

  const formContext = useForm();
  const submitted = useFormSubmitted();
  const processing = useFormProcessing();
  const modified = useFormModified();
  const { user } = useAuth();
  const { id } = useDocumentInfo();
  const operation = useOperation();

  const {
    dispatchFields,
    getField,
    getData,
    getSiblingData,
    setModified,
  } = formContext || {};

  const [internalValue, setInternalValue] = useState(undefined);

  // Debounce internal values to update form state only every 60ms
  const debouncedValue = useDebounce(internalValue, 120);

  // Get field by path
  const field = getField(path);

  const initialValue = field?.initialValue as T;

  // Valid could be a string equal to an error message
  const valid = (field && typeof field.valid === 'boolean') ? field.valid : true;
  const showError = valid === false && submitted;

  // Method to send update field values from field component(s)
  // Should only be used internally
  const sendField = useCallback(async (valueToSend) => {
    const fieldToDispatch = {
      path,
      disableFormData,
      ignoreWhileFlattening,
      initialValue,
      validate,
      condition,
      value: valueToSend,
      valid: false,
      errorMessage: undefined,
    };

    const validateOptions = {
      id,
      user,
      data: getData(),
      siblingData: getSiblingData(path),
      operation,
    };

    const validationResult = typeof validate === 'function' ? await validate(valueToSend, validateOptions) : true;

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
    condition,
    disableFormData,
    dispatchFields,
    getData,
    getSiblingData,
    id,
    ignoreWhileFlattening,
    initialValue,
    operation,
    path,
    user,
    validate,
  ]);

  // Method to return from `useField`, used to
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
    ignoreWhileFlattening,
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
    path,
    valueToSend,
    sendField,
    field,
  ]);

  return {
    ...options,
    showError,
    errorMessage: field?.errorMessage,
    value: internalValue,
    formSubmitted: submitted,
    formProcessing: processing,
    setValue,
    initialValue,
  };
};

export default useField;
