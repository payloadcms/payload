import React, {
  useReducer, useEffect, useRef, useState, useCallback,
} from 'react';
import { serialize } from 'object-to-formdata';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@payloadcms/config-provider';
import { useLocale } from '../../utilities/Locale';
import { requests } from '../../../api';
import useThrottledEffect from '../../../hooks/useThrottledEffect';
import fieldReducer from './fieldReducer';
import initContextState from './initContextState';
import reduceFieldsToValues from './reduceFieldsToValues';
import getSiblingDataFunc from './getSiblingData';
import getDataByPathFunc from './getDataByPath';
import wait from '../../../../utilities/wait';
import buildInitialState from './buildInitialState';
import errorMessages from './errorMessages';
import { Context as FormContextType, Props } from './types';

import { SubmittedContext, ProcessingContext, ModifiedContext, FormContext, FormWatchContext } from './context';

const baseClass = 'form';

const Form: React.FC<Props> = (props) => {
  const {
    disabled,
    onSubmit,
    method,
    action,
    handleResponse,
    onSuccess,
    children,
    className,
    redirect,
    disableSuccessStatus,
    initialState, // fully formed initial field state
    initialData, // values only, paths are required as key - form should build initial state as convenience
    waitForAutocomplete,
    log,
  } = props;

  const history = useHistory();
  const locale = useLocale();
  const { refreshCookie } = useAuth();

  const [modified, setModified] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formattedInitialData, setFormattedInitialData] = useState(buildInitialState(initialData));

  const contextRef = useRef({} as FormContextType);

  let initialFieldState = {};

  if (formattedInitialData) initialFieldState = formattedInitialData;
  if (initialState) initialFieldState = initialState;

  // Allow access to initialState for field types such as Blocks and Array
  contextRef.current.initialState = initialState;

  const [fields, dispatchFields] = useReducer(fieldReducer, {}, () => initialFieldState);

  contextRef.current.fields = fields;

  const validateForm = useCallback(async () => {
    const validatedFieldState = {};
    let isValid = true;

    const data = contextRef.current.getData();

    const validationPromises = Object.entries(contextRef.current.fields).map(async ([path, field]) => {
      const validatedField = {
        ...field,
        valid: true,
      };

      const siblingData = contextRef.current.getSiblingData(path);

      let passesConditionalLogic = true;

      if (typeof field?.condition === 'function') {
        passesConditionalLogic = await field.condition(data, siblingData);
      }

      let validationResult: boolean | string = true;

      if (passesConditionalLogic && typeof field.validate === 'function') {
        validationResult = await field.validate(field.value);
      }

      if (typeof validationResult === 'string') {
        validatedField.errorMessage = validationResult;
        validatedField.valid = false;
        isValid = false;
      }

      validatedFieldState[path] = validatedField;
    });

    await Promise.all(validationPromises);

    dispatchFields({ type: 'REPLACE_STATE', state: validatedFieldState });

    return isValid;
  }, [contextRef]);

  const submit = useCallback(async (e): Promise<void> => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    setProcessing(true);

    if (waitForAutocomplete) await wait(100);

    const isValid = await contextRef.current.validateForm();

    setSubmitted(true);

    // If not valid, prevent submission
    if (!isValid) {
      toast.error('Please correct invalid fields.');
      setProcessing(false);

      return;
    }

    // If submit handler comes through via props, run that
    if (onSubmit) {
      onSubmit(fields, reduceFieldsToValues(fields));
      return;
    }

    const formData = contextRef.current.createFormData();

    try {
      const res = await requests[method.toLowerCase()](action, {
        body: formData,
      });

      setModified(false);

      if (typeof handleResponse === 'function') {
        handleResponse(res);
        return;
      }

      setProcessing(false);

      const contentType = res.headers.get('content-type');
      const isJSON = contentType && contentType.indexOf('application/json') !== -1;

      let json: any = {};

      if (isJSON) json = await res.json();

      if (res.status < 400) {
        setSubmitted(false);

        if (typeof onSuccess === 'function') onSuccess(json);

        if (redirect) {
          const destination = {
            pathname: redirect,
            state: {},
          };

          if (typeof json === 'object' && json.message && !disableSuccessStatus) {
            destination.state = {
              status: [
                {
                  message: json.message,
                  type: 'success',
                },
              ],
            };
          }

          history.push(destination);
        } else if (!disableSuccessStatus) {
          toast.success(json.message || 'Submission successful.', { autoClose: 3000 });
        }
      } else {
        contextRef.current = { ...contextRef.current }; // triggers rerender of all components that subscribe to form

        if (json.message) {
          toast.error(json.message);

          return;
        }

        if (Array.isArray(json.errors)) {
          const [fieldErrors, nonFieldErrors] = json.errors.reduce(
            ([fieldErrs, nonFieldErrs], err) => {
              const newFieldErrs = [];
              const newNonFieldErrs = [];

              if (err?.message) {
                newNonFieldErrs.push(err);
              }

              if (Array.isArray(err?.data)) {
                err.data.forEach((dataError) => {
                  if (dataError?.field) {
                    newFieldErrs.push(dataError);
                  } else {
                    newNonFieldErrs.push(dataError);
                  }
                });
              }

              return [
                [
                  ...fieldErrs,
                  ...newFieldErrs,
                ],
                [
                  ...nonFieldErrs,
                  ...newNonFieldErrs,
                ],
              ];
            },
            [[], []],
          );

          fieldErrors.forEach((err) => {
            dispatchFields({
              ...(contextRef.current?.fields?.[err.field] || {}),
              valid: false,
              errorMessage: err.message,
              path: err.field,
            });
          });

          nonFieldErrors.forEach((err) => {
            toast.error(err.message || 'An unknown error occurred.');
          });

          return;
        }

        const message = errorMessages[res.status] || 'An unknown error occurrred.';

        toast.error(message);
      }

      return;
    } catch (err) {
      setProcessing(false);

      toast.error(err);
    }
  }, [
    action,
    disableSuccessStatus,
    disabled,
    fields,
    handleResponse,
    history,
    method,
    onSubmit,
    onSuccess,
    redirect,
    waitForAutocomplete,
  ]);


  const getFields = useCallback(() => contextRef.current.fields, [contextRef]);
  const getField = useCallback((path: string) => contextRef.current.fields[path], [contextRef]);
  const getData = useCallback(() => reduceFieldsToValues(contextRef.current.fields, true), [contextRef]);
  const getSiblingData = useCallback((path: string) => getSiblingDataFunc(contextRef.current.fields, path), [contextRef]);
  const getDataByPath = useCallback((path: string) => getDataByPathFunc(contextRef.current.fields, path), [contextRef]);
  const getUnflattenedValues = useCallback(() => reduceFieldsToValues(contextRef.current.fields), [contextRef]);

  const createFormData = useCallback(() => {
    const data = reduceFieldsToValues(contextRef.current.fields);

    // nullAsUndefineds is important to allow uploads and relationship fields to clear themselves
    const formData = serialize(data, { indices: true, nullsAsUndefineds: false });
    return formData;
  }, [contextRef]);

  contextRef.current.dispatchFields = dispatchFields;
  contextRef.current.submit = submit;
  contextRef.current.getFields = getFields;
  contextRef.current.getField = getField;
  contextRef.current.getData = getData;
  contextRef.current.getSiblingData = getSiblingData;
  contextRef.current.getDataByPath = getDataByPath;
  contextRef.current.getUnflattenedValues = getUnflattenedValues;
  contextRef.current.validateForm = validateForm;
  contextRef.current.createFormData = createFormData;
  contextRef.current.setModified = setModified;
  contextRef.current.setProcessing = setProcessing;
  contextRef.current.setSubmitted = setSubmitted;
  contextRef.current.disabled = disabled;

  useEffect(() => {
    if (initialState) {
      contextRef.current = { ...initContextState } as FormContextType;
      dispatchFields({ type: 'REPLACE_STATE', state: initialState });
    }
  }, [initialState]);

  useEffect(() => {
    if (initialData) {
      contextRef.current = { ...initContextState } as FormContextType;
      const builtState = buildInitialState(initialData);
      setFormattedInitialData(builtState);
      dispatchFields({ type: 'REPLACE_STATE', state: builtState });
    }
  }, [initialData]);

  useThrottledEffect(() => {
    refreshCookie();
  }, 15000, [fields]);

  useEffect(() => {
    contextRef.current = { ...contextRef.current }; // triggers rerender of all components that subscribe to form
    setModified(false);
  }, [locale]);

  const classes = [
    className,
    baseClass,
  ].filter(Boolean).join(' ');

  if (log) {
    // eslint-disable-next-line no-console
    console.log(fields);
  }

  return (
    <form
      noValidate
      onSubmit={contextRef.current.submit}
      method={method}
      action={action}
      className={classes}
    >
      <FormContext.Provider value={contextRef.current}>
        <FormWatchContext.Provider value={{
          fields,
          ...contextRef.current,
        }}
        >
          <SubmittedContext.Provider value={submitted}>
            <ProcessingContext.Provider value={processing}>
              <ModifiedContext.Provider value={modified}>
                {children}
              </ModifiedContext.Provider>
            </ProcessingContext.Provider>
          </SubmittedContext.Provider>
        </FormWatchContext.Provider>
      </FormContext.Provider>
    </form>
  );
};

export default Form;
