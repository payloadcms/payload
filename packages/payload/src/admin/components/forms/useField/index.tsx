import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { UPDATE } from '../Form/types';
import type { FieldType, Options } from './types';

import useThrottledEffect from '../../../hooks/useThrottledEffect';
import { useAuth } from '../../utilities/Auth';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useOperation } from '../../utilities/OperationProvider';
import { useForm, useFormFields, useFormProcessing, useFormSubmitted } from '../Form/context';

/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/hooks#usefield
 */
const useField = <T, >(options: Options): FieldType<T> => {
  const {
    condition,
    disableFormData = false,
    hasRows,
    path,
    validate,
  } = options;

  const submitted = useFormSubmitted();
  const processing = useFormProcessing();
  const { user } = useAuth();
  const { id } = useDocumentInfo();
  const operation = useOperation();
  const field = useFormFields(([fields]) => fields[path]);
  const { t } = useTranslation();
  const dispatchField = useFormFields(([_, dispatch]) => dispatch);

  const { getData, getSiblingData, setModified } = useForm();

  const value = field?.value as T;
  const initialValue = field?.initialValue as T;
  const valid = typeof field?.valid === 'boolean' ? field.valid : true;
  const showError = valid === false && submitted;

  // Method to return from `useField`, used to
  // update field values from field component(s)
  const setValue = useCallback((e, disableModifyingForm = false) => {
    const val = (e && e.target) ? e.target.value : e;

    if (!disableModifyingForm) {
      if (typeof setModified === 'function') {
        // Update modified state after field value comes back
        // to avoid cursor jump caused by state value / DOM mismatch
        setTimeout(() => {
          setModified(true);
        }, 10);
      }
    }

    dispatchField({
      disableFormData: disableFormData || (hasRows && val > 0),
      path,
      type: 'UPDATE',
      value: val,
    });
  }, [
    setModified,
    path,
    dispatchField,
    disableFormData,
    hasRows,
  ]);

  // Store result from hook as ref
  // to prevent unnecessary rerenders
  const result: FieldType<T> = useMemo(() => ({
    errorMessage: field?.errorMessage,
    formProcessing: processing,
    formSubmitted: submitted,
    initialValue,
    rows: field?.rows,
    setValue,
    showError,
    valid: field?.valid,
    value,
  }), [
    field?.errorMessage,
    field?.rows,
    field?.valid,
    processing,
    setValue,
    showError,
    submitted,
    value,
    initialValue,
  ]);

  // Throttle the validate function
  useThrottledEffect(() => {
    const validateField = async () => {
      const action: UPDATE = {
        condition,
        disableFormData: disableFormData || (hasRows ? typeof value === 'number' && value > 0 : false),
        errorMessage: undefined,
        path,
        rows: field?.rows,
        type: 'UPDATE',
        valid: false,
        validate,
        value,
      };

      const validateOptions = {
        data: getData(),
        id,
        operation,
        siblingData: getSiblingData(path),
        t,
        user,
      };

      const validationResult = typeof validate === 'function' ? await validate(value, validateOptions) : true;

      if (typeof validationResult === 'string') {
        action.errorMessage = validationResult;
        action.valid = false;
      } else {
        action.valid = validationResult;
        action.errorMessage = undefined;
      }

      if (typeof dispatchField === 'function') {
        dispatchField(action);
      }
    };

    validateField();
  }, 150, [
    value,
    condition,
    disableFormData,
    dispatchField,
    getData,
    getSiblingData,
    id,
    operation,
    path,
    user,
    validate,
    field?.rows,
  ]);

  return result;
};

export default useField;
