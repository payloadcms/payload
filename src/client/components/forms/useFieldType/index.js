import { useContext, useCallback, useEffect } from 'react';
import FormContext from '../Form/Context';
import { useLocale } from '../../utilities/Locale';

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

  const {
    dispatchFields, submitted, processing, getFields,
  } = formContext;

  const fields = getFields();

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

  // Remove field from state on "unmount"
  useEffect(() => {
    return () => dispatchFields({ path, type: 'REMOVE' });
  }, [dispatchFields, path]);

  // Send up new value when initial data is loaded
  // only if it's defined
  useEffect(() => {
    if (initialData !== undefined) sendField(initialData);
  }, [initialData, sendField, locale]);

  const valid = fields[path] ? fields[path].valid : true;
  const showError = valid === false && submitted;

  const valueToRender = fields?.[path]?.value || initialData?.[path];

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
