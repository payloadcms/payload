import { useCallback, useEffect } from 'react';
import { useContextSelector } from 'use-context-selector';
import { useAuth } from '../../utilities/Auth';
import { FormContext, useFormProcessing, useFormSubmitted, useFormModified } from '../Form/context';
import { Options, FieldType } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useOperation } from '../../utilities/OperationProvider';
import useThrottledEffect from '../../../hooks/useThrottledEffect';

const useField = <T extends unknown>(options: Options): FieldType<T> => {
  const {
    path,
    validate,
    disableFormData = false,
    condition,
  } = options;

  const submitted = useFormSubmitted();
  const processing = useFormProcessing();
  const modified = useFormModified();
  const { user } = useAuth();
  const { id } = useDocumentInfo();
  const operation = useOperation();

  const field = useContextSelector(FormContext, (state) => state.fields[path]);
  const dispatchFields = useContextSelector(FormContext, (state) => state.dispatchFields);
  const getData = useContextSelector(FormContext, (state) => state.getData);
  const getSiblingData = useContextSelector(FormContext, (state) => state.getSiblingData);
  const setModified = useContextSelector(FormContext, (state) => state.setModified);

  const value = field?.value as T;
  const valid = typeof field?.valid === 'boolean' ? field.valid : true;
  const showError = valid === false && submitted;

  // Method to return from `useField`, used to
  // update field values from field component(s)
  const setValue = useCallback((e, disableModifyingForm = false) => {
    const val = (e && e.target) ? e.target.value : e;

    if (!modified && !disableModifyingForm) {
      if (typeof setModified === 'function') {
        setModified(true);
      }
    }
    dispatchFields({
      type: 'UPDATE_VALUE',
      path,
      value: val,
    });
  }, [
    setModified,
    modified,
    path,
    dispatchFields,
  ]);

  // Throttle the validate function
  useThrottledEffect(() => {
    const validateField = async () => {
      const fieldToDispatch = {
        path,
        disableFormData,
        validate,
        condition,
        value,
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

      const validationResult = typeof validate === 'function' ? await validate(value, validateOptions) : true;

      if (typeof validationResult === 'string') {
        fieldToDispatch.errorMessage = validationResult;
        fieldToDispatch.valid = false;
      } else {
        fieldToDispatch.valid = validationResult;
        fieldToDispatch.errorMessage = undefined;
      }

      if (fieldToDispatch.valid !== valid && typeof dispatchFields === 'function') {
        dispatchFields(fieldToDispatch);
      }
    };

    validateField();
  }, 150, [
    value,
    condition,
    disableFormData,
    dispatchFields,
    getData,
    getSiblingData,
    id,
    operation,
    path,
    user,
    validate,
    valid,
  ]);

  useEffect(() => {
    console.log(path);
  });

  return {
    ...options,
    showError,
    errorMessage: field?.errorMessage,
    value,
    formSubmitted: submitted,
    formProcessing: processing,
    setValue,
  };
};

export default useField;
