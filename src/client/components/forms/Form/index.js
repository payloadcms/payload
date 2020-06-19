import React, {
  useState, useReducer, useCallback, useEffect,
} from 'react';
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

const reduceFieldsToValues = (fields) => {
  const data = {};

  Object.keys(fields).forEach((key) => {
    if (!fields[key].disableFormData) {
      data[key] = fields[key].value;
    }
  });

  return unflatten(data);
};

const Form = (props) => {
  const {
    onSubmit,
    ajax,
    method,
    action,
    handleAjaxResponse,
    onSuccess,
    children,
    className,
    redirect,
    disableSuccessStatus,
  } = props;

  const [fields, dispatchFields] = useReducer(fieldReducer, {});
  const [submitted, setSubmitted] = useState(false);
  const [modified, setModified] = useState(false);
  const [processing, setProcessing] = useState(false);
  const history = useHistory();
  const locale = useLocale();
  const { replaceStatus, addStatus, clearStatus } = useStatusList();
  const { refreshToken } = useUser();

  const getFields = useCallback(() => {
    return fields;
  }, [fields]);

  const getField = useCallback((path) => {
    return fields[path];
  }, [fields]);

  const getData = useCallback(() => {
    return reduceFieldsToValues(fields);
  }, [fields]);

  const getSiblingData = useCallback((path) => {
    let siblingFields = fields;

    // If this field is nested
    // We can provide a list of sibling fields
    if (path.indexOf('.') > 0) {
      const parentFieldPath = path.substring(0, path.lastIndexOf('.') + 1);
      siblingFields = Object.keys(fields).reduce((siblings, fieldKey) => {
        if (fieldKey.indexOf(parentFieldPath) === 0) {
          return {
            ...siblings,
            [fieldKey.replace(parentFieldPath, '')]: fields[fieldKey],
          };
        }

        return siblings;
      }, {});
    }

    return reduceFieldsToValues(siblingFields);
  }, [fields]);

  const getDataByPath = useCallback((path) => {
    const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1);

    const rows = Object.keys(fields).reduce((matchedRows, key) => {
      if (key.indexOf(`${path}.`) === 0) {
        return {
          ...matchedRows,
          [key.replace(pathPrefixToRemove, '')]: fields[key],
        };
      }

      return matchedRows;
    }, {});

    const rowValues = reduceFieldsToValues(rows);
    const unflattenedRows = unflatten(rowValues);
    return unflattenedRows;
  }, [fields]);

  const validateForm = useCallback(() => {
    return !Object.values(fields).some((field) => {
      return field.valid === false;
    });
  }, [fields]);

  const submit = useCallback((e) => {
    setSubmitted(true);

    const isValid = validateForm();

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

    // If form is AJAX, fetch data
    if (ajax !== false) {
      e.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      const data = getData();

      setProcessing(true);
      // Make the API call from the action
      return requests[method.toLowerCase()](action, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => {
        if (typeof handleAjaxResponse === 'function') return handleAjaxResponse(res);

        return res.json().then((json) => {
          setProcessing(false);
          setModified(false);
          clearStatus();

          if (res.status < 400) {
            if (typeof onSuccess === 'function') onSuccess(json);

            if (redirect) {
              return history.push(redirect, data);
            }

            if (!disableSuccessStatus) {
              replaceStatus([{
                message: json.message,
                type: 'success',
                disappear: 3000,
              }]);
            }
          } else {
            if (json.message) {
              addStatus({
                message: json.message,
                type: 'error',
              });

              return json;
            }

            if (Array.isArray(json.errors)) {
              const [fieldErrors, nonFieldErrors] = json.errors.reduce(([fieldErrs, nonFieldErrs], err) => {
                return err.field && err.message ? [[...fieldErrs, err], nonFieldErrs] : [fieldErrs, [...nonFieldErrs, err]];
              }, [[], []]);

              fieldErrors.forEach((err) => {
                dispatchFields({
                  valid: false,
                  errorMessage: err.message,
                  path: err.field,
                  value: fields?.[err.field]?.value,
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
    }

    return true;
  }, [
    action,
    addStatus,
    ajax,
    disableSuccessStatus,
    fields,
    handleAjaxResponse,
    history,
    method,
    onSubmit,
    redirect,
    getData,
    clearStatus,
    validateForm,
    onSuccess,
    replaceStatus,
  ]);

  useThrottledEffect(() => {
    refreshToken();
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
        getDataByPath,
        getData,
        getSiblingData,
        validateForm,
        modified,
        setModified,
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
  onSuccess: null,
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
  onSuccess: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
  redirect: PropTypes.string,
};

export default Form;
