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
import { Context, Fields, Context as FormContextType, GetDataByPath, Props, Row, SubmitOptions } from './types';
import { SubmittedContext, ProcessingContext, ModifiedContext, FormContext, FormFieldsContext, FormWatchContext } from './context';
import buildStateFromSchema from './buildStateFromSchema';
import { useOperation } from '../../utilities/OperationProvider';
import { WatchFormErrors } from './WatchFormErrors';
import { splitPathByArrayFields } from '../../../../utilities/splitPathByArrayFields';
import { setsAreEqual } from '../../../../utilities/setsAreEqual';
import { buildFieldSchemaMap } from '../../../../utilities/buildFieldSchemaMap';
import { isNumber } from '../../../../utilities/isNumber';

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
  const { id, getDocPreferences, collection, global } = useDocumentInfo();
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

  // Build a current set of child errors for all rows in form state
  const buildRowErrors = useCallback(() => {
    const existingFieldRows: { [path: string]: Row[] } = {};
    const newFieldRows: { [path: string]: Row[] } = {};

    Object.entries(fields).forEach(([path, field]) => {
      const pathSegments = splitPathByArrayFields(path);

      for (let i = 0; i < pathSegments.length; i += 1) {
        const fieldPath = pathSegments.slice(0, i + 1).join('.');
        const formField = fields?.[fieldPath];

        // Is this an array or blocks field?
        if (Array.isArray(formField?.rows)) {
          // Keep a reference to the existing row state
          existingFieldRows[fieldPath] = formField.rows;

          // A new row state will be used to compare
          // against the old state later,
          // to see if we need to dispatch an update
          if (!newFieldRows[fieldPath]) {
            newFieldRows[fieldPath] = formField.rows.map((existingRow) => ({
              ...existingRow,
              childErrorPaths: new Set(),
            }));
          }

          const rowIndex = pathSegments[i + 1];
          const childFieldPath = pathSegments.slice(i + 1).join('.');

          if (field.valid === false && childFieldPath) {
            newFieldRows[fieldPath][rowIndex].childErrorPaths.add(`${fieldPath}.${childFieldPath}`);
          }
        }
      }
    });

    // Now loop over all fields with rows -
    // if anything changed, dispatch an update for the field
    // with the new row state
    Object.entries(newFieldRows).forEach(([path, newRows]) => {
      const stateMatches = newRows.every((newRow, i) => {
        const existingRowErrorPaths = existingFieldRows[path][i]?.childErrorPaths;
        return setsAreEqual(newRow.childErrorPaths, existingRowErrorPaths);
      });

      if (!stateMatches) {
        dispatchFields({
          type: 'UPDATE',
          path,
          rows: newRows,
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
    contextRef.current.buildRowErrors();

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

  const traverseRowConfigs = React.useCallback(({ pathPrefix, path, fieldConfig }: {
    path: string,
    fieldConfig: Field[]
    pathPrefix?: string,
  }) => {
    const config = fieldConfig;
    const pathSegments = splitPathByArrayFields(path);
    const configMap = buildFieldSchemaMap(config);

    for (let i = 0; i < pathSegments.length; i += 1) {
      const pathSegment = pathSegments[i];

      if (isNumber(pathSegment)) {
        const rowIndex = parseInt(pathSegment, 10);
        const parentFieldPath = pathSegments.slice(0, i).join('.');
        const remainingPath = pathSegments.slice(i + 1).join('.');
        const arrayFieldPath = pathPrefix ? `${pathPrefix}.${parentFieldPath}` : parentFieldPath;
        const parentArrayField = contextRef.current.getField(arrayFieldPath);
        const rowField = parentArrayField.rows[rowIndex];

        if (rowField.blockType) {
          const blockConfig = configMap.get(`${parentFieldPath}.${rowField.blockType}`);
          if (blockConfig) {
            return traverseRowConfigs({
              pathPrefix: `${arrayFieldPath}.${rowIndex}`,
              path: remainingPath,
              fieldConfig: blockConfig,
            });
          }

          throw new Error(`Block config not found for ${rowField.blockType} at path ${path}`);
        } else {
          return traverseRowConfigs({
            pathPrefix: `${arrayFieldPath}.${rowIndex}`,
            path: remainingPath,
            fieldConfig: configMap.get(parentFieldPath),
          });
        }
      }
    }

    return config;
  }, []);

  const getRowConfigByPath = React.useCallback(({ path, blockType }: {
    path: string,
    blockType?: string
  }) => {
    const rowConfig = traverseRowConfigs({ path, fieldConfig: collection?.fields || global?.fields });
    const rowFieldConfigs = buildFieldSchemaMap(rowConfig);
    const pathSegments = splitPathByArrayFields(path);
    const fieldKey = pathSegments.at(-1);
    return rowFieldConfigs.get(blockType ? `${fieldKey}.${blockType}` : fieldKey);
  }, [traverseRowConfigs, collection?.fields, global?.fields]);

  // Array/Block row manipulation
  const addFieldRow: Context['addFieldRow'] = useCallback(async ({ path, rowIndex, data }) => {
    const preferences = await getDocPreferences();
    const fieldConfig = getRowConfigByPath({
      path,
      blockType: data?.blockType,
    });

    if (fieldConfig) {
      const subFieldState = await buildStateFromSchema({ fieldSchema: fieldConfig, data, preferences, operation, id, user, locale, t });
      dispatchFields({ type: 'ADD_ROW', rowIndex: rowIndex - 1, path, blockType: data?.blockType, subFieldState });
    }
  }, [dispatchFields, getDocPreferences, id, user, operation, locale, t, getRowConfigByPath]);

  const removeFieldRow: Context['removeFieldRow'] = useCallback(async ({ path, rowIndex }) => {
    dispatchFields({ type: 'REMOVE_ROW', rowIndex, path });
  }, [dispatchFields]);

  const replaceFieldRow: Context['replaceFieldRow'] = useCallback(async ({ path, rowIndex, data }) => {
    const preferences = await getDocPreferences();
    const fieldConfig = getRowConfigByPath({
      path,
      blockType: data?.blockType,
    });

    if (fieldConfig) {
      const subFieldState = await buildStateFromSchema({ fieldSchema: fieldConfig, data, preferences, operation, id, user, locale, t });
      dispatchFields({ type: 'REPLACE_ROW', rowIndex: rowIndex - 1, path, blockType: data?.blockType, subFieldState });
    }
  }, [dispatchFields, getDocPreferences, id, user, operation, locale, t, getRowConfigByPath]);

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
  contextRef.current.buildRowErrors = buildRowErrors;
  contextRef.current.addFieldRow = addFieldRow;
  contextRef.current.removeFieldRow = removeFieldRow;
  contextRef.current.replaceFieldRow = replaceFieldRow;

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
                  <WatchFormErrors buildRowErrors={buildRowErrors} />
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
