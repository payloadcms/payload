import React, {
  useReducer, useEffect, useRef, useState, useCallback,
} from 'react';
import { objectToFormData } from 'object-to-formdata';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useLocale } from '../../utilities/Locale';
import { useStatusList } from '../../elements/Status';
import { requests } from '../../../api';
import useThrottledEffect from '../../../hooks/useThrottledEffect';
import { useUser } from '../../data/User';
import fieldReducer from './fieldReducer';
import initContextState from './initContextState';
import reduceFieldsToValues from './reduceFieldsToValues';
import getSiblingDataFunc from './getSiblingData';
import getDataByPathFunc from './getDataByPath';

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
    initialState,
  } = props;

  const history = useHistory();
  const locale = useLocale();
  const { replaceStatus, addStatus, clearStatus } = useStatusList();
  const { refreshCookie } = useUser();

  const [modified, setModified] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contextRef = useRef({ ...initContextState });

  contextRef.current.initialState = initialState;

  const [fields, dispatchFields] = useReducer(fieldReducer, {});
  contextRef.current.fields = fields;

  const submit = useCallback((e) => {
    if (disabled) {
      e.preventDefault();
      return false;
    }

    e.stopPropagation();
    setSubmitted(true);

    const isValid = contextRef.current.validateForm();

    // If not valid, prevent submission
    if (!isValid) {
      e.preventDefault();

      addStatus({
        message: 'Please correct the fields below.',
        type: 'error',
      });

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      return false;
    }

    // If submit handler comes through via props, run that
    if (onSubmit) {
      e.preventDefault();
      return onSubmit(fields);
    }

    e.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    const formData = contextRef.current.createFormData();

    setProcessing(true);

    // Make the API call from the action
    return requests[method.toLowerCase()](action, {
      body: formData,
    }).then((res) => {
      setModified(false);
      if (typeof handleResponse === 'function') return handleResponse(res);

      return res.json().then((json) => {
        setProcessing(false);
        clearStatus();

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
            replaceStatus([{
              message: json.message,
              type: 'success',
              disappear: 3000,
            }]);
          }
        } else {
          contextRef.current = { ...contextRef.current }; // triggers rerender of all components that subscribe to form

          if (json.message) {
            addStatus({
              message: json.message,
              type: 'error',
            });

            return json;
          }

          if (Array.isArray(json.errors)) {
            const [fieldErrors, nonFieldErrors] = json.errors.reduce(([fieldErrs, nonFieldErrs], err) => (err.field && err.message ? [[...fieldErrs, err], nonFieldErrs] : [fieldErrs, [...nonFieldErrs, err]]), [[], []]);

            fieldErrors.forEach((err) => {
              dispatchFields({
                ...(contextRef.current?.fields?.[err.field] || {}),
                valid: false,
                errorMessage: err.message,
                path: err.field,
              });
            });

            nonFieldErrors.forEach((err) => {
              addStatus({
                message: err.message || 'An unknown error occurred.',
                type: 'error',
              });
            });

            if (fieldErrors.length > 0 && nonFieldErrors.length === 0) {
              addStatus({
                message: 'Please correct the fields below.',
                type: 'error',
              });
            }

            return json;
          }

          addStatus({
            message: 'An unknown error occurred.',
            type: 'error',
          });
        }

        return json;
      });
    }).catch((err) => {
      addStatus({
        message: err,
        type: 'error',
      });
    });
  }, [
    action,
    addStatus,
    clearStatus,
    disableSuccessStatus,
    disabled,
    fields,
    handleResponse,
    history,
    method,
    onSubmit,
    onSuccess,
    redirect,
    replaceStatus,
  ]);


  const getFields = useCallback(() => contextRef.current.fields, [contextRef]);
  const getField = useCallback((path) => contextRef.current.fields[path], [contextRef]);
  const getData = useCallback(() => reduceFieldsToValues(contextRef.current.fields, true), [contextRef]);

  const getSiblingData = useCallback((path) => getSiblingDataFunc(contextRef.current.fields, path), [contextRef]);

  const getDataByPath = useCallback((path) => getDataByPathFunc(contextRef.current.fields, path), [contextRef]);

  const getUnflattenedValues = useCallback(() => reduceFieldsToValues(contextRef.current.fields), [contextRef]);

  const validateForm = useCallback(() => !Object.values(contextRef.current.fields).some((field) => field.valid === false), [contextRef]);

  const createFormData = useCallback(() => {
    const data = reduceFieldsToValues(contextRef.current.fields);
    return objectToFormData(data, { indices: true });
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

  useEffect(() => {
    contextRef.current = { ...initContextState };
    dispatchFields({ type: 'REPLACE_STATE', state: initialState });
  }, [initialState]);

  useThrottledEffect(() => {
    refreshCookie();
  }, 15000, [fields]);

  useEffect(() => {
    setModified(false);
  }, [locale]);

  const classes = [
    className,
    baseClass,
  ].filter(Boolean).join(' ');

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
  initialState: {},
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
};

export default Form;
