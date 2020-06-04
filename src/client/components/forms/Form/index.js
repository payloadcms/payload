import React, { useState, useReducer, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { unflatten } from 'flatley';
import HiddenInput from '../field-types/HiddenInput';
import FormContext from './Context';
import { useLocale } from '../../utilities/Locale';
import { useStatusList } from '../../elements/Status';
import { requests } from '../../../api';
import useThrottledEffect from '../../../hooks/useThrottledEffect';
import { useUser } from '../../data/User';
import fieldReducer from './reducer';

import './index.scss';

const baseClass = 'form';

const Form = (props) => {
  const {
    onSubmit,
    ajax,
    method,
    action,
    handleAjaxResponse,
    children,
    className,
    redirect,
    disableSuccessStatus,
    onError,
  } = props;

  const [fields, dispatchFields] = useReducer(fieldReducer, {});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const history = useHistory();
  const locale = useLocale();
  const { addStatus } = useStatusList();
  const { refreshToken } = useUser();

  const getFields = useCallback(() => {
    return fields;
  }, [fields]);

  const getField = useCallback((path) => {
    return fields[path];
  }, [fields]);

  const countRows = useCallback((rowName) => {
    const namePrefixToRemove = rowName.substring(0, rowName.lastIndexOf('.') + 1);

    const rows = Object.keys(fields).reduce((matchedRows, key) => {
      if (key.indexOf(`${rowName}.`) === 0) {
        return {
          ...matchedRows,
          [key.replace(namePrefixToRemove, '')]: fields[key],
        };
      }

      return matchedRows;
    }, {});

    const unflattenedRows = unflatten(rows);
    const rowCount = unflattenedRows[rowName.replace(namePrefixToRemove, '')]?.length || 0;
    return rowCount;
  }, [fields]);

  const submit = useCallback(async (e) => {
    setSubmitted(true);

    let isValid = true;

    Object.keys(fields).forEach((field) => {
      if (!fields[field].valid) {
        isValid = false;
      }
    });

    // If not valid, prevent submission
    if (!isValid) {
      e.preventDefault();

      // If submit handler comes through via props, run that
    } else if (onSubmit) {
      e.preventDefault();

      onSubmit(fields);

      // If form is AJAX, fetch data
    } else if (ajax !== false) {
      e.preventDefault();
      const data = {};

      // Clean up data passed from field state
      Object.keys(fields).forEach((key) => {
        data[key] = fields[key].value;
      });

      setProcessing(true);

      try {
        // Make the API call from the action
        const res = await requests[method.toLowerCase()](action, {
          body: JSON.stringify(unflatten(data)),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (res.status < 400) {
          // If prop handleAjaxResponse is passed, pass it the response
          if (typeof handleAjaxResponse === 'function') handleAjaxResponse(res);

          if (redirect) {
            return history.push(redirect, data);
          }

          setProcessing(false);

          const json = await res.json();

          if (!disableSuccessStatus) {
            addStatus({
              message: json.message,
              type: 'success',
            });
          }
        } else {
          throw res;
        }
      } catch (error) {
        setProcessing(false);

        if (typeof onError === 'function') onError(error);

        const json = await error.json();

        if (json.message) {
          addStatus({
            message: json.message,
            type: 'error',
          });
        } else if (Array.isArray(json.errors)) {
          const [fieldErrors, nonFieldErrors] = json.errors.reduce(([fieldErrs, nonFieldErrs], err) => {
            return err.field && err.message ? [[...fieldErrs, err], nonFieldErrs] : [fieldErrs, [...nonFieldErrs, err]];
          }, [[], []]);

          fieldErrors.forEach((err) => {
            dispatchFields({
              valid: false,
              errorMessage: err.message,
              path: err.field,
              value: fields[err.field].value,
            });
          });

          nonFieldErrors.forEach((err) => {
            addStatus({
              message: err.message || 'An unknown error occurred.',
              type: 'error',
            });
          });
        } else {
          addStatus({
            message: 'An unknown error occurred.',
            type: 'error',
          });
        }
      }
    }
    // If valid and not AJAX submit as usual
  }, [action, addStatus, ajax, disableSuccessStatus, fields, handleAjaxResponse, history, method, onSubmit, redirect, onError]);

  useThrottledEffect(() => {
    refreshToken();
  }, 15000, [fields]);

  const classes = [
    className,
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <form
      noValidate
      onSubmit={submit}
      method={method}
      action={action}
      className={classes}
    >
      <FormContext.Provider value={{
        dispatchFields,
        getFields,
        getField,
        processing,
        submitted,
        countRows,
      }}
      >
        <HiddenInput
          path="locale"
          defaultValue={locale}
        />
        {children}
      </FormContext.Provider>
    </form>
  );
};

Form.defaultProps = {
  redirect: '',
  onSubmit: null,
  ajax: true,
  method: 'POST',
  action: '',
  handleAjaxResponse: null,
  onError: null,
  className: '',
  disableSuccessStatus: false,
};

Form.propTypes = {
  disableSuccessStatus: PropTypes.bool,
  onSubmit: PropTypes.func,
  ajax: PropTypes.bool,
  method: PropTypes.oneOf(['post', 'POST', 'get', 'GET', 'put', 'PUT', 'delete', 'DELETE']),
  action: PropTypes.string,
  handleAjaxResponse: PropTypes.func,
  onError: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
  redirect: PropTypes.string,
};

export default Form;
