import React, {
  useReducer, useEffect, useRef,
} from 'react';
import { objectToFormData } from 'object-to-formdata';
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
import fieldReducer from './fieldReducer';
import initContextState from './initContextState';

import './index.scss';

const baseClass = 'form';

const reduceFieldsToValues = (fields, flatten) => {
  const data = {};

  Object.keys(fields).forEach((key) => {
    if (!fields[key].disableFormData && fields[key].value !== undefined) {
      data[key] = fields[key].value;
    }
  });

  if (flatten) {
    return unflatten(data, { safe: true });
  }

  return data;
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

  const history = useHistory();
  const locale = useLocale();
  const { replaceStatus, addStatus, clearStatus } = useStatusList();
  const { refreshToken } = useUser();

  const contextRef = useRef({ ...initContextState });
  const { current: contextValue } = contextRef;

  const [fields, dispatchFields] = useReducer(fieldReducer, {});
  contextValue.dispatchFields = dispatchFields;

  contextValue.submit = (e) => {
    e.stopPropagation();
    contextValue.setSubmitted(true);

    const isValid = contextValue.validateForm();

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

      const formData = contextValue.createFormData();
      contextValue.setProcessing(true);

      // Make the API call from the action
      return requests[method.toLowerCase()](action, {
        body: formData,
      }).then((res) => {
        contextValue.setModified(false);
        if (typeof handleAjaxResponse === 'function') return handleAjaxResponse(res);

        return res.json().then((json) => {
          contextValue.setProcessing(false);
          clearStatus();

          if (res.status < 400) {
            if (typeof onSuccess === 'function') onSuccess(json);

            if (redirect) {
              return history.push(redirect, json);
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
  };

  contextValue.getFields = () => {
    return fields;
  };

  contextValue.getField = (path) => {
    return fields[path];
  };

  contextValue.getData = () => {
    return reduceFieldsToValues(fields, true);
  };

  contextValue.getSiblingData = (path) => {
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

    return reduceFieldsToValues(siblingFields, true);
  };

  contextValue.getDataByPath = (path) => {
    const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1);
    const name = path.split('.').pop();

    const data = Object.keys(fields).reduce((matchedData, key) => {
      if (key.indexOf(`${path}.`) === 0) {
        return {
          ...matchedData,
          [key.replace(pathPrefixToRemove, '')]: fields[key],
        };
      }

      return matchedData;
    }, {});

    const values = reduceFieldsToValues(data, true);
    const unflattenedData = unflatten(values);
    return unflattenedData?.[name];
  };

  contextValue.getUnflattenedValues = () => {
    return reduceFieldsToValues(fields);
  };

  contextValue.validateForm = () => {
    return !Object.values(fields).some((field) => {
      return field.valid === false;
    });
  };

  contextValue.createFormData = () => {
    const data = reduceFieldsToValues(fields);
    return objectToFormData(data, { indices: true });
  };

  contextValue.setModified = (modified) => {
    contextValue.modified = modified;
  };

  contextValue.setSubmitted = (submitted) => {
    contextValue.submitted = submitted;
  };

  contextValue.setProcessing = (processing) => {
    contextValue.processing = processing;
  };

  useThrottledEffect(() => {
    refreshToken();
  }, 15000, [fields]);

  useEffect(() => {
    contextValue.modified = false;
  }, [locale, contextValue.modified]);

  const classes = [
    className,
    baseClass,
  ].filter(Boolean).join(' ');

  const { submit } = contextValue;

  console.log(fields);

  return (
    <form
      noValidate
      onSubmit={submit}
      method={method}
      action={action}
      className={classes}
    >
      <FormContext.Provider value={contextValue}>
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
