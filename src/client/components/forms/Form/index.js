import React, {
  useReducer, useEffect, useState, useRef,
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

  const [fields, dispatchFields] = useReducer(fieldReducer, {});
  const [contextState, setContextState] = useState(initContextState({ dispatchFields }));
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const {
    createFormData, validateForm, setSubmitted, setModified, setProcessing, submit,
  } = contextState;

  const history = useHistory();
  const locale = useLocale();
  const { replaceStatus, addStatus, clearStatus } = useStatusList();
  const { refreshToken } = useUser();

  useEffect(() => {
    const handleSubmit = (e) => {
      e.stopPropagation();
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

        const formData = createFormData();
        setProcessing(true);

        // Make the API call from the action
        return requests[method.toLowerCase()](action, {
          body: formData,
        }).then((res) => {
          setModified(false);
          if (typeof handleAjaxResponse === 'function') return handleAjaxResponse(res);

          return res.json().then((json) => {
            setProcessing(false);
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
    contextState.submit = handleSubmit;
    setContextState(contextState);
  }, [
    contextState,
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
    clearStatus,
    validateForm,
    onSuccess,
    replaceStatus,
    createFormData,
    setProcessing,
    setModified,
    setSubmitted,
  ]);

  useEffect(() => {
    contextState.getFields = () => {
      return fieldsRef.current;
    };

    contextState.getField = (path) => {
      return fieldsRef.current[path];
    };

    contextState.getData = () => {
      return reduceFieldsToValues(fieldsRef.current, true);
    };

    contextState.getSiblingData = (path) => {
      let siblingFields = fieldsRef.current;

      // If this field is nested
      // We can provide a list of sibling fields
      if (path.indexOf('.') > 0) {
        const parentFieldPath = path.substring(0, path.lastIndexOf('.') + 1);
        siblingFields = Object.keys(fieldsRef.current).reduce((siblings, fieldKey) => {
          if (fieldKey.indexOf(parentFieldPath) === 0) {
            return {
              ...siblings,
              [fieldKey.replace(parentFieldPath, '')]: fieldsRef.current[fieldKey],
            };
          }

          return siblings;
        }, {});
      }

      return reduceFieldsToValues(siblingFields, true);
    };

    contextState.getDataByPath = (path) => {
      const pathPrefixToRemove = path.substring(0, path.lastIndexOf('.') + 1);
      const name = path.split('.').pop();

      const data = Object.keys(fieldsRef.current).reduce((matchedData, key) => {
        if (key.indexOf(`${path}.`) === 0) {
          return {
            ...matchedData,
            [key.replace(pathPrefixToRemove, '')]: fieldsRef.current[key],
          };
        }

        return matchedData;
      }, {});

      const values = reduceFieldsToValues(data, true);
      const unflattenedData = unflatten(values);
      return unflattenedData?.[name];
    };

    contextState.getUnflattenedValues = () => {
      return reduceFieldsToValues(fieldsRef.current);
    };

    contextState.validateForm = () => {
      return !Object.values(fieldsRef.current).some((field) => {
        return field.valid === false;
      });
    };

    contextState.createFormData = () => {
      const data = reduceFieldsToValues(fieldsRef.current);
      return objectToFormData(data, { indices: true });
    };

    setContextState(contextState);
  }, [fieldsRef, contextState]);

  useEffect(() => {
    function setModifiedState(modified) {
      contextState.modified = modified;
    }

    function setSubmittedState(submitted) {
      contextState.submitted = submitted;
    }

    function setProcessingState(processing) {
      contextState.processing = processing;
    }

    contextState.setModified = setModifiedState;
    contextState.setSubmitted = setSubmittedState;
    contextState.setProcessing = setProcessingState;
  }, [contextState]);

  useThrottledEffect(() => {
    refreshToken();
  }, 15000, [fields]);

  useEffect(() => {
    setModified(false);
  }, [locale, setModified]);

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
      <FormContext.Provider value={contextState}>
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
