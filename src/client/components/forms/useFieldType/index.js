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
    initialData,
    onChange,
    validate,
  } = options;

  const locale = useLocale();
  const formContext = useContext(FormContext);
  const [internalValue, setInternalValue] = useState(initialData);
  const debouncedValue = useDebounce(internalValue, 400);

  const {
    dispatchFields, submitted, processing, getField,
  } = formContext;

  const field = getField(path);
  const valid = field?.valid || true;
  const showError = valid === false && submitted;

  const sendField = useCallback((valueToSend) => {
    const fieldToDispatch = { path, value: valueToSend };

    fieldToDispatch.valid = (required && typeof validate === 'function') ? validate(valueToSend || '') : true;

    if (typeof fieldToDispatch.valid === 'string') {
      fieldToDispatch.errorMessage = fieldToDispatch.valid;
      fieldToDispatch.valid = false;
    }

    dispatchFields(fieldToDispatch);
  }, [path, required, dispatchFields, validate]);

  const setValue = useCallback((e) => {
    if (e?.target?.value) {
      setInternalValue(e.target.value);
    } else if (e !== undefined) {
      setInternalValue(e);
    }

    if (onChange && typeof onChange === 'function') onChange(e);
  }, [onChange, setInternalValue]);

  // Remove field from state on "unmount"
  useEffect(() => {
    return () => dispatchFields({ path, type: 'REMOVE' });
  }, [dispatchFields, path]);

  useEffect(() => {
    if (debouncedValue !== undefined) {
      sendField(debouncedValue);
    }
  }, [debouncedValue, sendField, locale]);

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
