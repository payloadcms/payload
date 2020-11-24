import React, {
  useReducer, useEffect, useRef, useState, useCallback,
} from 'react';
import { objectToFormData } from 'object-to-formdata';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { useLocale } from '../../utilities/Locale';
import { requests } from '../../../api';
import useThrottledEffect from '../../../hooks/useThrottledEffect';
import { useAuth } from '@payloadcms/config-provider';
import fieldReducer from './fieldReducer';
import initContextState from './initContextState';
import reduceFieldsToValues from './reduceFieldsToValues';
import getSiblingDataFunc from './getSiblingData';
import getDataByPathFunc from './getDataByPath';
import wait from '../../../../utilities/wait';
import buildInitialState from './buildInitialState';
import errorMessages from './errorMessages';

import { SubmittedContext, ProcessingContext, ModifiedContext, FormContext, FieldContext } from './context';

import './index.scss';

const baseClass = 'form';

const Form = (props) => {
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

  const contextRef = useRef({ ...initContextState });

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

    const validationPromises = Object.entries(contextRef.current.fields).map(async ([path, field]) => {
      const validatedField = { ...field };

      validatedField.valid = typeof field.validate === 'function' ? await field.validate(field.value) : true;

      if (typeof validatedField.valid === 'string') {
        validatedField.errorMessage = validatedField.valid;
        validatedField.valid = false;
        isValid = false;
      }

      validatedFieldState[path] = validatedField;
    });

    await Promise.all(validationPromises);

    dispatchFields({ type: 'REPLACE_STATE', state: validatedFieldState });

    return isValid;
  }, [contextRef]);

  const submit = useCallback(async (e) => {
    if (disabled) {
      e.preventDefault();
      return false;
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

      return false;
    }

    // If submit handler comes through via props, run that
    if (onSubmit) {
      return onSubmit(fields, reduceFieldsToValues(fields));
    }

    const formData = contextRef.current.createFormData();

    try {
      const res = await requests[method.toLowerCase()](action, {
        body: formData,
      });

      setModified(false);

      if (typeof handleResponse === 'function') return handleResponse(res);


      setProcessing(false);

      const contentType = res.headers.get('content-type');
      const isJSON = contentType && contentType.indexOf('application/json') !== -1;

      let json = {};
      if (isJSON) json = await res.json();

      if (res.status < 400) {
        setSubmitted(false);

        if (typeof onSuccess === 'function') onSuccess(json);

        if (redirect) {
          const destination = {
            pathname: redirect,
          };

          if (json.message && !disableSuccessStatus) {
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

          return json;
        }

        if (Array.isArray(json.errors)) {
          const [fieldErrors, nonFieldErrors] = (errors) => errors.reduce(([fieldErrs, nonFieldErrs], err) => {
            if (err.data) {
              return [[...fieldErrs, ...err.data], [...nonFieldErrs, err]];
            }
            return [fieldErrs, [...nonFieldErrs, err]];
          }, [[], []]);

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

          return json;
        }

        const message = errorMessages[res.status] || 'An unknown error occurrred.';

        toast.error(message);
      }

      return json;
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
  const getField = useCallback((path) => contextRef.current.fields[path], [contextRef]);
  const getData = useCallback(() => reduceFieldsToValues(contextRef.current.fields, true), [contextRef]);
  const getSiblingData = useCallback((path) => getSiblingDataFunc(contextRef.current.fields, path), [contextRef]);
  const getDataByPath = useCallback((path) => getDataByPathFunc(contextRef.current.fields, path), [contextRef]);
  const getUnflattenedValues = useCallback(() => reduceFieldsToValues(contextRef.current.fields), [contextRef]);

  const createFormData = useCallback(() => {
    const data = reduceFieldsToValues(contextRef.current.fields);

    // nullAsUndefineds is important to allow uploads and relationship fields to clear themselves
    const formData = objectToFormData(data, { indices: true, nullsAsUndefineds: false });
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
      contextRef.current = { ...initContextState };
      dispatchFields({ type: 'REPLACE_STATE', state: initialState });
    }
  }, [initialState]);

  useEffect(() => {
    if (initialData) {
      contextRef.current = { ...initContextState };
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
        <FieldContext.Provider value={{
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
        </FieldContext.Provider>
      </FormContext.Provider>
    </form>
  );
};

Form.defaultProps = {
  redirect: '',
  onSubmit: null,
  method: 'POST',
  action: '',
  handleResponse: null,
  onSuccess: null,
  className: '',
  disableSuccessStatus: false,
  disabled: false,
  initialState: undefined,
  waitForAutocomplete: false,
  initialData: undefined,
  log: false,
};

Form.propTypes = {
  disableSuccessStatus: PropTypes.bool,
  onSubmit: PropTypes.func,
  method: PropTypes.oneOf(['post', 'POST', 'get', 'GET', 'put', 'PUT', 'delete', 'DELETE']),
  action: PropTypes.string,
  handleResponse: PropTypes.func,
  onSuccess: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
  redirect: PropTypes.string,
  disabled: PropTypes.bool,
  initialState: PropTypes.shape({}),
  waitForAutocomplete: PropTypes.bool,
  initialData: PropTypes.shape({}),
  log: PropTypes.bool,
};

export default Form;
