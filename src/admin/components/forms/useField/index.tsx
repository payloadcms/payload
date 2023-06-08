import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utilities/Auth';
import { useFormProcessing, useFormSubmitted, useFormModified, useForm, useFormFields } from '../Form/context';
import { Options, FieldType } from './types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useOperation } from '../../utilities/OperationProvider';
import useThrottledEffect from '../../../hooks/useThrottledEffect';
import { UPDATE } from '../Form/types';

/**
 * Get and set the value of a form field.
 *
 * @see https://payloadcms.com/docs/admin/hooks#usefield
 */
const useField = <T, >(options: Options): FieldType<T> => {
  const {
    path,
    validate,
    disableFormData = false,
    condition,
    hasRows,
  } = options;

  const submitted = useFormSubmitted();
  const processing = useFormProcessing();
  const modified = useFormModified();
  const { user } = useAuth();
  const { id } = useDocumentInfo();
  const operation = useOperation();
  const field = useFormFields(([fields]) => fields[path]);
  const dispatchField = useFormFields(([_, dispatch]) => dispatch);
  const { t } = useTranslation();

  const { getData, getSiblingData, setModified } = useForm();

  const value = field?.value as T;
  const initialValue = field?.initialValue as T;
  const valid = typeof field?.valid === 'boolean' ? field.valid : true;
  const showError = valid === false && submitted;

  // Method to return from `useField`, used to
  // update field values from field component(s)
  const setValue = useCallback((e, disableModifyingForm = false) => {
    const val = (e && e.target) ? e.target.value : e;

    if (!modified && !disableModifyingForm) {
      if (typeof setModified === 'function') {
        // Update modified state after field value comes back
        // to avoid cursor jump caused by state value / DOM mismatch
        setTimeout(() => {
          setModified(true);
        }, 10);
      }
    }

    dispatchField({
      type: 'UPDATE',
      path,
      value: val,
      disableFormData: disableFormData || (hasRows && val > 0),
    });
  }, [
    setModified,
    modified,
    path,
    dispatchField,
    disableFormData,
    hasRows,
  ]);

  // Store result from hook as ref
  // to prevent unnecessary rerenders
  const result = useMemo(() => ({
    showError,
    errorMessage: field?.errorMessage,
    value,
    formSubmitted: submitted,
    formProcessing: processing,
    setValue,
    initialValue,
    rows: field?.rows,
  }), [field, processing, setValue, showError, submitted, value, initialValue]);

  // Throttle the validate function
  useThrottledEffect(() => {
    const validateField = async () => {
      const action: UPDATE = {
        type: 'UPDATE',
        path,
        disableFormData: disableFormData || (hasRows ? typeof value === 'number' && value > 0 : false),
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
        t,
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
  ]);

  return result;
};

export default useField;
