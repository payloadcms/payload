/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, {
  useReducer, useEffect, useRef, useState, useCallback,
} from 'react';
import isDeepEqual from 'deep-equal';
import { serialize } from 'object-to-formdata';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utilities/Auth';
import { useLocale } from '../../utilities/Locale';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { requests } from '../../../api';
import useThrottledEffect from '../../../hooks/useThrottledEffect';
import { fieldReducer } from './fieldReducer';
import initContextState from './initContextState';
import reduceFieldsToValues from './reduceFieldsToValues';
import getSiblingDataFunc from './getSiblingData';
import getDataByPathFunc from './getDataByPath';
import wait from '../../../../utilities/wait';
import { Field } from '../../../../fields/config/types';
import buildInitialState from './buildInitialState';
import errorMessages from './errorMessages';
import { Fields, Context as FormContextType, FormField, GetDataByPath, Props, SubmitOptions } from './types';
import { SubmittedContext, ProcessingContext, ModifiedContext, FormContext, FormFieldsContext, FormWatchContext } from './context';
import buildStateFromSchema from './buildStateFromSchema';
import { useOperation } from '../../utilities/OperationProvider';
import { isNumber } from '../../../../utilities/isNumber';
import { WatchFormErrors } from './WatchFormErrors';
import { areSetsEqual } from '../../../../utilities/areSetsEqual';

/**
  Turns: 'arrayField.0.group123field.arrayField.0.textField'

  Into: ['arrayField', '0', 'group123field.arrayField', '0', 'textField']
*/
function splitPathByArrayFields(str) {
  const regex = /\.(\d+)\./g;
  return str.split(regex).filter(Boolean);
}

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
  } = props;

  const history = useHistory();
  const locale = useLocale();
  const { t, i18n } = useTranslation('general');
  const { refreshCookie, user } = useAuth();
  const { id, getDocPreferences } = useDocumentInfo();
  const operation = useOperation();

  const [modified, setModified] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formattedInitialData, setFormattedInitialData] = useState(buildInitialState(initialData));

  const formRef = useRef<HTMLFormElement>(null);
  const contextRef = useRef({} as FormContextType);

  let initialFieldState = {};

  if (formattedInitialData) initialFieldState = formattedInitialData;
  if (initialState) initialFieldState = initialState;

  const fieldsReducer = useReducer(fieldReducer, {}, () => initialFieldState);
  const [fields, dispatchFields] = fieldsReducer;

  contextRef.current.fields = fields;
  contextRef.current.dispatchFields = dispatchFields;

  const calculateNestedErrorPaths = useCallback(() => {
    const arrayFieldsOnly: { [key: string]: FormField } = {};
    Object.entries(fields).forEach(([path, field]) => {
      const keySegments = splitPathByArrayFields(path);

      for (let i = keySegments.length - 1; i >= 0; i -= 1) {
        const possibleRowIndex = keySegments[i];

        if (isNumber(possibleRowIndex)) {
          const arrayPath = keySegments.slice(0, i).join('.');
          const fieldPath = keySegments.slice(i + 1).join('.');
          const arrayField = fields[arrayPath];

          /*
            field name could be a number, so we need to
            check for `rows` to ensure it is an array field
          */
          if ('rows' in arrayField) {
            if (!arrayFieldsOnly[arrayPath]) {
              // reset childErrorPaths
              arrayFieldsOnly[arrayPath] = {
                ...arrayField,
                rows: arrayField.rows.map((row) => ({
                  ...row,
                  childErrorPaths: new Set(),
                })),
              };
            }

            if ('valid' in field && !field.valid) {
              arrayFieldsOnly[arrayPath].rows[possibleRowIndex].childErrorPaths.add(fieldPath);
            }
          }
        }
      }
    });

    // We cannot do this in 1 loop over `fields`
    // Need to ensure stale paths are removed, i.e. when a row is removed
    Object.entries(arrayFieldsOnly).forEach(([path, arrayField]) => {
      let rowsHaveChanged = false;
      let rowErrorCount = 0;
      const newRows = arrayField.rows.map((row, rowIndex) => {
        const { childErrorPaths } = row;
        const { childErrorPaths: prevChildErrorPaths } = fields[path].rows[rowIndex];

        if (!areSetsEqual(prevChildErrorPaths, childErrorPaths)) {
          rowsHaveChanged = true;
          rowErrorCount += childErrorPaths?.size || 0;

          return {
            ...row,
            childErrorPaths,
          };
        }


        return row;
      });

      if (rowsHaveChanged) {
        dispatchFields({
          type: 'UPDATE',
          path,
          rows: newRows,
          rowErrorCount,
        });
      }
    });
  }, [fields, dispatchFields]);

  const validateForm = useCallback(async () => {
    const validatedFieldState = {};
    let isValid = true;
    const data = contextRef.current.getData();

    const validationPromises = Object.entries(contextRef.current.fields).map(async ([path, field]) => {
      const validatedField = {
        ...field,
        valid: true,
      };

      if (field.passesCondition !== false) {
        let validationResult: boolean | string = true;

        if (typeof field.validate === 'function') {
          validationResult = await field.validate(field.value, {
            data,
            siblingData: contextRef.current.getSiblingData(path),
            user,
            id,
            operation,
            t,
          });
        }

        if (typeof validationResult === 'string') {
          validatedField.errorMessage = validationResult;
          validatedField.valid = false;
          isValid = false;
        }
      }

      validatedFieldState[path] = validatedField;
    });

    await Promise.all(validationPromises);

    if (!isDeepEqual(contextRef.current.fields, validatedFieldState)) {
      dispatchFields({ type: 'REPLACE_STATE', state: validatedFieldState });
    }

    return isValid;
  }, [contextRef, id, user, operation, t, dispatchFields]);

  const submit = useCallback(async (options: SubmitOptions = {}, e): Promise<void> => {
    const {
      overrides = {},
      action: actionToUse = action,
      method: methodToUse = method,
      skipValidation,
    } = options;

    if (disabled) {
      if (e) {
        e.preventDefault();
      }
      return;
    }

    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setProcessing(true);

    if (waitForAutocomplete) await wait(100);

    const isValid = skipValidation ? true : await contextRef.current.validateForm();
    contextRef.current.calculateNestedErrorPaths();

    if (!skipValidation) setSubmitted(true);

    // If not valid, prevent submission
    if (!isValid) {
      toast.error(t('error:correctInvalidFields'));
      setProcessing(false);

      return;
    }

    // If submit handler comes through via props, run that
    if (onSubmit) {
      const data = {
        ...reduceFieldsToValues(fields, true),
        ...overrides,
      };

      onSubmit(fields, data);
    }

    const formData = contextRef.current.createFormData(overrides);

    try {
      const res = await requests[methodToUse.toLowerCase()](actionToUse, {
        body: formData,
        headers: {
          'Accept-Language': i18n.language,
        },
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
          toast.success(json.message || t('submissionSuccessful'), { autoClose: 3000 });
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
              type: 'UPDATE',
              ...(contextRef.current?.fields?.[err.field] || {}),
              valid: false,
              errorMessage: err.message,
              path: err.field,
            });
          });

          nonFieldErrors.forEach((err) => {
            toast.error(err.message || t('error:unknown'));
          });

          return;
        }

        const message = errorMessages[res.status] || t('error:unknown');

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
    dispatchFields,
    fields,
    handleResponse,
    history,
    method,
    onSubmit,
    onSuccess,
    redirect,
    t,
    i18n,
    waitForAutocomplete,
  ]);

  const getFields = useCallback(() => contextRef.current.fields, [contextRef]);
  const getField = useCallback((path: string) => contextRef.current.fields[path], [contextRef]);
  const getData = useCallback(() => reduceFieldsToValues(contextRef.current.fields, true), [contextRef]);
  const getSiblingData = useCallback((path: string) => getSiblingDataFunc(contextRef.current.fields, path), [contextRef]);
  const getDataByPath = useCallback<GetDataByPath>((path: string) => getDataByPathFunc(contextRef.current.fields, path), [contextRef]);

  const createFormData = useCallback((overrides: any = {}) => {
    const data = reduceFieldsToValues(contextRef.current.fields, true);

    const file = data?.file;

    if (file) {
      delete data.file;
    }

    const dataWithOverrides = {
      ...data,
      ...overrides,
    };

    const dataToSerialize = {
      _payload: JSON.stringify(dataWithOverrides),
      file,
    };

    // nullAsUndefineds is important to allow uploads and relationship fields to clear themselves
    const formData = serialize(dataToSerialize, { indices: true, nullsAsUndefineds: false });
    return formData;
  }, [contextRef]);

  const reset = useCallback(async (fieldSchema: Field[], data: unknown) => {
    const preferences = await getDocPreferences();
    const state = await buildStateFromSchema({ fieldSchema, preferences, data, user, id, operation, locale, t });
    contextRef.current = { ...initContextState } as FormContextType;
    setModified(false);
    dispatchFields({ type: 'REPLACE_STATE', state });
  }, [id, user, operation, locale, t, dispatchFields, getDocPreferences]);

  const replaceState = useCallback((state: Fields) => {
    contextRef.current = { ...initContextState } as FormContextType;
    setModified(false);
    dispatchFields({ type: 'REPLACE_STATE', state });
  }, [dispatchFields]);

  contextRef.current.submit = submit;
  contextRef.current.getFields = getFields;
  contextRef.current.getField = getField;
  contextRef.current.getData = getData;
  contextRef.current.getSiblingData = getSiblingData;
  contextRef.current.getDataByPath = getDataByPath;
  contextRef.current.validateForm = validateForm;
  contextRef.current.createFormData = createFormData;
  contextRef.current.setModified = setModified;
  contextRef.current.setProcessing = setProcessing;
  contextRef.current.setSubmitted = setSubmitted;
  contextRef.current.disabled = disabled;
  contextRef.current.formRef = formRef;
  contextRef.current.reset = reset;
  contextRef.current.replaceState = replaceState;
  contextRef.current.calculateNestedErrorPaths = calculateNestedErrorPaths;

  useEffect(() => {
    if (initialState) {
      contextRef.current = { ...initContextState } as FormContextType;
      dispatchFields({ type: 'REPLACE_STATE', state: initialState });
    }
  }, [initialState, dispatchFields]);

  useEffect(() => {
    if (initialData) {
      contextRef.current = { ...initContextState } as FormContextType;
      const builtState = buildInitialState(initialData);
      setFormattedInitialData(builtState);
      dispatchFields({ type: 'REPLACE_STATE', state: builtState });
    }
  }, [initialData, dispatchFields]);

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

  return (
    <form
      noValidate
      onSubmit={(e) => contextRef.current.submit({}, e)}
      method={method}
      action={action}
      className={classes}
      ref={formRef}
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
                <FormFieldsContext.Provider value={fieldsReducer}>
                  <WatchFormErrors calculateNestedErrorPaths={calculateNestedErrorPaths} />
                  {children}
                </FormFieldsContext.Provider>
              </ModifiedContext.Provider>
            </ProcessingContext.Provider>
          </SubmittedContext.Provider>
        </FormWatchContext.Provider>
      </FormContext.Provider>
    </form>
  );
};

export default Form;
