import React, { useState, useReducer, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import flatten, { unflatten } from 'flat';
import FormContext from './Context';
import { useLocale } from '../../utilities/Locale';
import { useStatusList } from '../../modules/Status';
import HiddenInput from '../field-types/HiddenInput';
import { requests } from '../../../api';

import './index.scss';

const baseClass = 'form';

const reduceToFieldNames = fields => fields.reduce((acc, field) => {
  if (field.name) acc.push(field.name);
  return acc;
}, []);

const reindexRows = ({
  fieldName, fields, rowFieldNamesAsArray, totalRows, index: adjustmentIndex, type,
}) => {
  return Array.from(Array(totalRows).keys()).reduce((reindexedRows, _, rowIndex) => {
    const currentRow = rowFieldNamesAsArray.reduce((fieldAcc, rowFieldName) => {
      let newIndex;
      switch (type) {
        case 'addAfter':
          newIndex = rowIndex <= adjustmentIndex ? rowIndex : rowIndex + 1;
          if (rowIndex === adjustmentIndex) {
            return {
              ...fieldAcc,
              [`${fieldName}.${newIndex}.${rowFieldName}`]: fields[`${fieldName}.${rowIndex}.${rowFieldName}`],
            };
          }
          return {
            ...fieldAcc,
            [`${fieldName}.${newIndex}.${rowFieldName}`]: fields[`${fieldName}.${rowIndex}.${rowFieldName}`],
          };

        case 'remove':
          if (rowIndex === adjustmentIndex) return { ...fieldAcc };

          newIndex = rowIndex < adjustmentIndex ? rowIndex : rowIndex - 1;
          return {
            ...fieldAcc,
            [`${fieldName}.${newIndex}.${rowFieldName}`]: fields[`${fieldName}.${rowIndex}.${rowFieldName}`],
          };

        default:
          return { ...fieldAcc };
      }
    }, {});

    return { ...reindexedRows, ...currentRow };
  }, {});
};

const initialFieldState = {};
function fieldReducer(state, action) {
  switch (action.type) {
    case 'replace':
      return {
        ...action.value,
      };

    default:
      return {
        ...state,
        [action.name]: {
          value: action.value,
          valid: action.valid,
        },
      };
  }
}

const Form = (props) => {
  const [fields, dispatchFields] = useReducer(fieldReducer, initialFieldState);
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const history = useHistory();
  const locale = useLocale();
  const { addStatus } = useStatusList();

  function adjustRows({
    index, fieldName, fields: fieldsForInsert, totalRows, type,
  }) {
    const rowFieldNamesAsArray = reduceToFieldNames(fieldsForInsert);
    const reindexedRows = reindexRows({
      fieldName,
      fields,
      rowFieldNamesAsArray,
      totalRows,
      index,
      type,
    });

    const stateWithoutFields = { ...fields };
    Array.from(Array(totalRows).keys()).forEach((rowIndex) => {
      rowFieldNamesAsArray.forEach((rowFieldName) => { delete stateWithoutFields[`${fieldName}.${rowIndex}.${rowFieldName}`]; });
    });

    dispatchFields({
      type,
      value: {
        ...stateWithoutFields,
        ...reindexedRows,
      },
    });
  }

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
  } = props;

  const submit = (e) => {
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

      // Make the API call from the action
      requests[method.toLowerCase()](action, {
        body: JSON.stringify(unflatten(data)),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(
        (res) => {
          if (res.status < 400) {
            // If prop handleAjaxResponse is passed, pass it the response
            if (handleAjaxResponse && typeof handleAjaxResponse === 'function') {
              return handleAjaxResponse(res);
            }

            if (redirect) {
              return history.push(redirect, data);
            }

            setProcessing(false);

            res.json().then((json) => {
              if (!disableSuccessStatus) {
                addStatus({
                  message: json.message,
                  type: 'success',
                });
              }
            });
          } else {
            res.json().then((json) => {
              setProcessing(false);
              json.errors.forEach((err) => {
                addStatus({
                  message: err.message,
                  type: 'error',
                });
              });
            });
          }
        },
        (error) => {
          setProcessing(false);
          addStatus({
            message: error.message,
            type: 'error',
          });
        },
      );
    }

    // If valid and not AJAX submit as usual
  };

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
        fields,
        processing,
        submitted,
        adjustRows,
      }}
      >
        <HiddenInput
          name="locale"
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
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
  redirect: PropTypes.string,
};

export default Form;
