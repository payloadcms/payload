'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { dequal } from 'dequal/lite'; // lite: no need for Map and Set support
import { useRouter } from 'next/navigation.js';
import { serialize } from 'object-to-formdata';
import { deepCopyObjectSimpleWithoutReactComponents, getDataByPath as getDataByPathFunc, getSiblingData as getSiblingDataFunc, hasDraftValidationEnabled, reduceFieldsToValues, wait } from 'payload/shared';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FieldErrorsToast } from '../../elements/Toasts/fieldErrors.js';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js';
import { useEffectEvent } from '../../hooks/useEffectEvent.js';
import { useQueue } from '../../hooks/useQueue.js';
import { useThrottledEffect } from '../../hooks/useThrottledEffect.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useOperation } from '../../providers/Operation/index.js';
import { useRouteTransition } from '../../providers/RouteTransition/index.js';
import { useServerFunctions } from '../../providers/ServerFunctions/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { useUploadHandlers } from '../../providers/UploadHandlers/index.js';
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js';
import { requests } from '../../utilities/api.js';
import { BackgroundProcessingContext, DocumentFormContext, FormContext, FormFieldsContext, FormWatchContext, InitializingContext, ModifiedContext, ProcessingContext, SubmittedContext, useDocumentForm } from './context.js';
import { errorMessages } from './errorMessages.js';
import { fieldReducer } from './fieldReducer.js';
import { initContextState } from './initContextState.js';
const baseClass = 'form';
export const Form = props => {
  const {
    id,
    collectionSlug,
    docConfig,
    docPermissions,
    getDocPreferences,
    globalSlug
  } = useDocumentInfo();
  const validateDrafts = hasDraftValidationEnabled(docConfig);
  const {
    action,
    beforeSubmit,
    children,
    className,
    disabled: disabledFromProps,
    disableSuccessStatus,
    disableValidationOnSubmit,
    // fields: fieldsFromProps = collection?.fields || global?.fields,
    el,
    handleResponse,
    initialState,
    isDocumentForm,
    isInitializing: initializingFromProps,
    onChange,
    onSubmit,
    onSuccess,
    redirect,
    submitted: submittedFromProps,
    uuid,
    waitForAutocomplete
  } = props;
  const method = 'method' in props ? props?.method : undefined;
  const router = useRouter();
  const documentForm = useDocumentForm();
  const {
    code: locale
  } = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    refreshCookie,
    user
  } = useAuth();
  const operation = useOperation();
  const {
    queueTask
  } = useQueue();
  const {
    getFormState
  } = useServerFunctions();
  const {
    startRouteTransition
  } = useRouteTransition();
  const {
    getUploadHandler
  } = useUploadHandlers();
  const {
    config
  } = useConfig();
  const [disabled, setDisabled] = useState(disabledFromProps || false);
  const [isMounted, setIsMounted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  /**
  * Tracks wether the form state passes validation.
  * For example the state could be submitted but invalid as field errors have been returned.
  */
  const [isValid, setIsValid] = useState(true);
  const [initializing, setInitializing] = useState(initializingFromProps);
  const [processing, setProcessing] = useState(false);
  /**
  * Determines whether the form is processing asynchronously in the background, e.g. autosave is running.
  * Useful to determine whether to disable the form or queue other processes while in flight, e.g. disable manual submits while an autosave is running.
  */
  const [backgroundProcessing, _setBackgroundProcessing] = useState(false);
  /**
  * A ref that can be read within the `setModified` interceptor.
  * Dependents of this state can read it immediately without needing to wait for a render cycle.
  */
  const backgroundProcessingRef = useRef(backgroundProcessing);
  /**
  * Flag to track if the form was modified _during a submission_, e.g. while autosave is running.
  * Useful in order to avoid resetting `modified` to false wrongfully after a submit.
  * For example, if the user modifies a field while the a background process (autosave) is running,
  * we need to ensure that after the submit completes, the `modified` state remains true.
  */
  const modifiedWhileProcessingRef = useRef(false);
  /**
  * Intercept the `setBackgroundProcessing` method to keep the ref in sync.
  * See the `backgroundProcessingRef` for more details.
  */
  const setBackgroundProcessing = useCallback(backgroundProcessing_0 => {
    backgroundProcessingRef.current = backgroundProcessing_0;
    _setBackgroundProcessing(backgroundProcessing_0);
  }, []);
  const [modified, _setModified] = useState(false);
  /**
  * Intercept the `setModified` method to track whether the event happened during background processing.
  * See the `modifiedWhileProcessingRef` ref for more details.
  */
  const setModified = useCallback(modified_0 => {
    if (backgroundProcessingRef.current) {
      modifiedWhileProcessingRef.current = true;
    }
    _setModified(modified_0);
  }, []);
  const formRef = useRef(null);
  const contextRef = useRef({});
  const abortResetFormRef = useRef(null);
  const isFirstRenderRef = useRef(true);
  const fieldsReducer = useReducer(fieldReducer, {}, () => initialState);
  const [formState, dispatchFields] = fieldsReducer;
  contextRef.current.fields = formState;
  const prevFormState = useRef(formState);
  const validateForm = useCallback(async () => {
    const validatedFieldState = {};
    let isValid_0 = true;
    const data = contextRef.current.getData();
    const validationPromises = Object.entries(contextRef.current.fields).map(async ([path, field]) => {
      const validatedField = field;
      const pathSegments = path ? path.split('.') : [];
      if (field.passesCondition !== false) {
        let validationResult = validatedField.valid;
        if ('validate' in field && typeof field.validate === 'function') {
          let valueToValidate = field.value;
          if (field?.rows && Array.isArray(field.rows)) {
            valueToValidate = contextRef.current.getDataByPath(path);
          }
          validationResult = await field.validate(valueToValidate, {
            ...field,
            id,
            collectionSlug,
            // If there is a parent document form, we can get the data from that form
            blockData: undefined,
            data: documentForm?.getData ? documentForm.getData() : data,
            event: 'submit',
            operation,
            path: pathSegments,
            preferences: {},
            req: {
              payload: {
                config
              },
              t,
              user
            },
            siblingData: contextRef.current.getSiblingData(path)
          });
          if (typeof validationResult === 'string') {
            validatedField.errorMessage = validationResult;
            validatedField.valid = false;
          } else {
            validatedField.valid = true;
            validatedField.errorMessage = undefined;
          }
        }
        if (validatedField.valid === false) {
          isValid_0 = false;
        }
      }
      validatedFieldState[path] = validatedField;
    });
    await Promise.all(validationPromises);
    if (!dequal(contextRef.current.fields, validatedFieldState)) {
      dispatchFields({
        type: 'REPLACE_STATE',
        state: validatedFieldState
      });
    }
    setIsValid(isValid_0);
    return isValid_0;
  }, [collectionSlug, config, dispatchFields, id, operation, t, user, documentForm]);
  const submit = useCallback(async (options, e) => {
    const {
      acceptValues = true,
      action: actionArg = action,
      context,
      disableFormWhileProcessing = true,
      disableSuccessStatus: disableSuccessStatusFromArgs,
      method: methodToUse = method,
      overrides: overridesFromArgs = {},
      skipValidation
    } = options || {};
    const disableToast = disableSuccessStatusFromArgs ?? disableSuccessStatus;
    if (disabled) {
      if (e) {
        e.preventDefault();
      }
      return;
    }
    // create new toast promise which will resolve manually later
    let errorToast, successToast;
    const promise = new Promise((resolve, reject) => {
      successToast = resolve;
      errorToast = reject;
    });
    const hasFormSubmitAction = actionArg || typeof action === 'string' || typeof action === 'function';
    if (redirect || disableToast || !hasFormSubmitAction) {
      // Do not show submitting toast, as the promise toast may never disappear under these conditions.
      // Instead, make successToast() or errorToast() throw toast.success / toast.error
      successToast = data_0 => toast.success(data_0);
      errorToast = data_1 => toast.error(data_1);
    } else {
      toast.promise(promise, {
        error: data_2 => {
          return data_2;
        },
        loading: t('general:submitting'),
        success: data_3 => {
          return data_3;
        }
      });
    }
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (disableFormWhileProcessing) {
      setProcessing(true);
      setDisabled(true);
    }
    if (waitForAutocomplete) {
      await wait(100);
    }
    const data_4 = reduceFieldsToValues(contextRef.current.fields, true);
    const serializableFormState = deepCopyObjectSimpleWithoutReactComponents(contextRef.current.fields, {
      excludeFiles: true
    });
    // Execute server side validations
    if (Array.isArray(beforeSubmit)) {
      let revalidatedFormState;
      await beforeSubmit.reduce(async (priorOnChange, beforeSubmitFn) => {
        await priorOnChange;
        const result = await beforeSubmitFn({
          formState: serializableFormState
        });
        revalidatedFormState = result;
      }, Promise.resolve());
      const isValid_1 = Object.entries(revalidatedFormState).every(([, field_0]) => field_0.valid !== false);
      setIsValid(isValid_1);
      if (!isValid_1) {
        setProcessing(false);
        setSubmitted(true);
        setDisabled(false);
        return dispatchFields({
          type: 'REPLACE_STATE',
          state: revalidatedFormState
        });
      }
    }
    const isValid_2 = skipValidation || disableValidationOnSubmit ? true : await contextRef.current.validateForm();
    setIsValid(isValid_2);
    // If not valid, prevent submission
    if (!isValid_2) {
      errorToast(t('error:correctInvalidFields'));
      setProcessing(false);
      setSubmitted(true);
      setDisabled(false);
      return;
    }
    let overrides = {};
    if (typeof overridesFromArgs === 'function') {
      overrides = overridesFromArgs(contextRef.current.fields);
    } else if (typeof overridesFromArgs === 'object') {
      overrides = overridesFromArgs;
    }
    // If submit handler comes through via props, run that
    if (onSubmit) {
      for (const [key, value] of Object.entries(overrides)) {
        data_4[key] = value;
      }
      onSubmit(contextRef.current.fields, data_4);
    }
    if (!hasFormSubmitAction) {
      // No action provided, so we should return. An example where this happens are lexical link drawers. Upon submitting the drawer, we
      // want to close it without submitting the form. Stuff like validation would be handled by lexical before this, through beforeSubmit
      setProcessing(false);
      setSubmitted(true);
      setDisabled(false);
      return;
    }
    try {
      const formData = await contextRef.current.createFormData(overrides, {
        data: data_4,
        mergeOverrideData: Boolean(typeof overridesFromArgs !== 'function')
      });
      let res;
      if (typeof actionArg === 'string') {
        res = await requests[methodToUse.toLowerCase()](actionArg, {
          body: formData,
          headers: {
            'Accept-Language': i18n.language
          }
        });
      } else if (typeof action === 'function') {
        res = await action(formData);
      }
      if (!modifiedWhileProcessingRef.current) {
        setModified(false);
      } else {
        modifiedWhileProcessingRef.current = false;
      }
      setDisabled(false);
      if (typeof handleResponse === 'function') {
        handleResponse(res, successToast, errorToast);
        return;
      }
      const contentType = res.headers.get('content-type');
      const isJSON = contentType && contentType.indexOf('application/json') !== -1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let json = {};
      if (isJSON) {
        json = await res.json();
      }
      if (res.status < 400) {
        if (typeof onSuccess === 'function') {
          const newFormState = await onSuccess(json, {
            context,
            formState: serializableFormState
          });
          if (newFormState) {
            dispatchFields({
              type: 'MERGE_SERVER_STATE',
              acceptValues,
              prevStateRef: prevFormState,
              serverState: newFormState
            });
          }
        }
        setSubmitted(false);
        setProcessing(false);
        if (redirect) {
          startRouteTransition(() => router.push(redirect));
        } else if (!disableToast) {
          successToast(json.message || t('general:submissionSuccessful'));
        }
      } else {
        setProcessing(false);
        setSubmitted(true);
        // When there was an error submitting a draft,
        // set the form state to unsubmitted, to not trigger visible form validation on changes after the failed submit.
        // Also keep the form as modified so the save button remains enabled for retry.
        if (overridesFromArgs['_status'] === 'draft') {
          setModified(true);
          if (!validateDrafts) {
            setSubmitted(false);
          }
        }
        contextRef.current = {
          ...contextRef.current
        }; // triggers rerender of all components that subscribe to form
        if (json.message) {
          errorToast(json.message);
          return;
        }
        if (Array.isArray(json.errors)) {
          const [fieldErrors, nonFieldErrors] = json.errors.reduce(([fieldErrs, nonFieldErrs], err_0) => {
            const newFieldErrs = [];
            const newNonFieldErrs = [];
            if (err_0?.message) {
              newNonFieldErrs.push(err_0);
            }
            if (Array.isArray(err_0?.data?.errors)) {
              err_0.data?.errors.forEach(dataError => {
                if (dataError?.path) {
                  newFieldErrs.push(dataError);
                } else {
                  newNonFieldErrs.push(dataError);
                }
              });
            }
            return [[...fieldErrs, ...newFieldErrs], [...nonFieldErrs, ...newNonFieldErrs]];
          }, [[], []]);
          setIsValid(false);
          dispatchFields({
            type: 'ADD_SERVER_ERRORS',
            errors: fieldErrors
          });
          nonFieldErrors.forEach(err_1 => {
            errorToast(/*#__PURE__*/_jsx(FieldErrorsToast, {
              errorMessage: err_1.message || t('error:unknown')
            }));
          });
          return;
        }
        const message = errorMessages?.[res.status] || res?.statusText || t('error:unknown');
        errorToast(message);
      }
      return {
        formState: contextRef.current.fields,
        res
      };
    } catch (err) {
      console.error('Error submitting form', err); // eslint-disable-line no-console
      setProcessing(false);
      setSubmitted(true);
      setDisabled(false);
      errorToast(err.message);
    }
  }, [beforeSubmit, startRouteTransition, action, disableSuccessStatus, disableValidationOnSubmit, disabled, dispatchFields, handleResponse, method, onSubmit, onSuccess, redirect, router, t, i18n, validateDrafts, waitForAutocomplete, setModified, setSubmitted]);
  const getFields = useCallback(() => contextRef.current.fields, []);
  const getField = useCallback(path_0 => contextRef.current.fields[path_0], []);
  const getData = useCallback(() => reduceFieldsToValues(contextRef.current.fields, true), []);
  const getSiblingData = useCallback(path_1 => getSiblingDataFunc(contextRef.current.fields, path_1), []);
  const getDataByPath = useCallback(path_2 => getDataByPathFunc(contextRef.current.fields, path_2), []);
  const createFormData = useCallback(async (overrides_0, {
    data: dataFromArgs,
    mergeOverrideData = true
  }) => {
    let data_5 = dataFromArgs || reduceFieldsToValues(contextRef.current.fields, true);
    let file = data_5?.file;
    if (docConfig && 'upload' in docConfig && docConfig.upload && file) {
      delete data_5.file;
      const handler = getUploadHandler({
        collectionSlug
      });
      if (typeof handler === 'function') {
        let filename = file.name;
        const clientUploadContext = await handler({
          file,
          updateFilename: value_0 => {
            filename = value_0;
          }
        });
        file = JSON.stringify({
          clientUploadContext,
          collectionSlug,
          filename,
          mimeType: file.type,
          size: file.size
        });
      }
    }
    if (mergeOverrideData) {
      data_5 = {
        ...data_5,
        ...overrides_0
      };
    } else {
      data_5 = overrides_0;
    }
    const dataToSerialize = {
      _payload: JSON.stringify(data_5)
    };
    if (docConfig && 'upload' in docConfig && docConfig.upload && file) {
      dataToSerialize.file = file;
    }
    // nullAsUndefineds is important to allow uploads and relationship fields to clear themselves
    const formData_0 = serialize(dataToSerialize, {
      indices: true,
      nullsAsUndefineds: false
    });
    return formData_0;
  }, [collectionSlug, docConfig, getUploadHandler]);
  const reset = useCallback(async data_6 => {
    const controller = handleAbortRef(abortResetFormRef);
    const docPreferences = await getDocPreferences();
    const {
      state: newState
    } = await getFormState({
      id,
      collectionSlug,
      data: data_6,
      docPermissions,
      docPreferences,
      globalSlug,
      locale,
      operation,
      renderAllFields: true,
      schemaPath: collectionSlug ? collectionSlug : globalSlug,
      signal: controller.signal,
      skipValidation: true
    });
    contextRef.current = {
      ...initContextState
    };
    setModified(false);
    dispatchFields({
      type: 'REPLACE_STATE',
      state: newState
    });
    abortResetFormRef.current = null;
  }, [collectionSlug, dispatchFields, globalSlug, id, operation, getFormState, docPermissions, getDocPreferences, locale, setModified]);
  const replaceState = useCallback(state => {
    contextRef.current = {
      ...initContextState
    };
    setModified(false);
    dispatchFields({
      type: 'REPLACE_STATE',
      state
    });
  }, [dispatchFields, setModified]);
  const addFieldRow = useCallback(({
    blockType,
    path: path_3,
    rowIndex: rowIndexArg,
    subFieldState
  }) => {
    const newRows = getDataByPath(path_3) || [];
    const rowIndex = rowIndexArg === undefined ? newRows.length : rowIndexArg;
    // dispatch ADD_ROW adds a blank row to local form state.
    // This performs no form state request, as the debounced onChange effect will do that for us.
    dispatchFields({
      type: 'ADD_ROW',
      blockType,
      path: path_3,
      rowIndex,
      subFieldState
    });
    setModified(true);
  }, [dispatchFields, getDataByPath, setModified]);
  const moveFieldRow = useCallback(({
    moveFromIndex,
    moveToIndex,
    path: path_4
  }) => {
    dispatchFields({
      type: 'MOVE_ROW',
      moveFromIndex,
      moveToIndex,
      path: path_4
    });
    setModified(true);
  }, [dispatchFields, setModified]);
  const removeFieldRow = useCallback(({
    path: path_5,
    rowIndex: rowIndex_0
  }) => {
    dispatchFields({
      type: 'REMOVE_ROW',
      path: path_5,
      rowIndex: rowIndex_0
    });
    setModified(true);
  }, [dispatchFields, setModified]);
  const replaceFieldRow = useCallback(({
    blockType: blockType_0,
    path: path_6,
    rowIndex: rowIndexArg_0,
    subFieldState: subFieldState_0
  }) => {
    const currentRows = getDataByPath(path_6);
    const rowIndex_1 = rowIndexArg_0 === undefined ? currentRows.length : rowIndexArg_0;
    dispatchFields({
      type: 'REPLACE_ROW',
      blockType: blockType_0,
      path: path_6,
      rowIndex: rowIndex_1,
      subFieldState: subFieldState_0
    });
    setModified(true);
  }, [dispatchFields, getDataByPath, setModified]);
  useEffect(() => {
    const abortOnChange = abortResetFormRef.current;
    return () => {
      abortAndIgnore(abortOnChange);
    };
  }, []);
  useEffect(() => {
    if (initializingFromProps !== undefined) {
      setInitializing(initializingFromProps);
    }
  }, [initializingFromProps]);
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
  contextRef.current.setBackgroundProcessing = setBackgroundProcessing;
  contextRef.current.setSubmitted = setSubmitted;
  contextRef.current.setIsValid = setIsValid;
  contextRef.current.disabled = disabled;
  contextRef.current.setDisabled = setDisabled;
  contextRef.current.formRef = formRef;
  contextRef.current.reset = reset;
  contextRef.current.replaceState = replaceState;
  contextRef.current.dispatchFields = dispatchFields;
  contextRef.current.addFieldRow = addFieldRow;
  contextRef.current.removeFieldRow = removeFieldRow;
  contextRef.current.moveFieldRow = moveFieldRow;
  contextRef.current.replaceFieldRow = replaceFieldRow;
  contextRef.current.uuid = uuid;
  contextRef.current.initializing = initializing;
  contextRef.current.isValid = isValid;
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    if (typeof disabledFromProps === 'boolean') {
      setDisabled(disabledFromProps);
    }
  }, [disabledFromProps]);
  useEffect(() => {
    if (typeof submittedFromProps === 'boolean') {
      setSubmitted(submittedFromProps);
    }
  }, [submittedFromProps]);
  useEffect(() => {
    if (initialState) {
      contextRef.current = {
        ...initContextState
      };
      dispatchFields({
        type: 'REPLACE_STATE',
        optimize: false,
        sanitize: true,
        state: initialState
      });
    }
  }, [initialState, dispatchFields]);
  useThrottledEffect(() => {
    refreshCookie();
  }, 15000, [formState]);
  const handleLocaleChange = useEffectEvent(() => {
    contextRef.current = {
      ...contextRef.current
    }; // triggers rerender of all components that subscribe to form
    setModified(false);
  });
  useEffect(() => {
    handleLocaleChange();
  }, [locale]);
  const classes = [className, baseClass].filter(Boolean).join(' ');
  const executeOnChange = useEffectEvent(submitted_0 => {
    queueTask(async () => {
      if (Array.isArray(onChange)) {
        let serverState;
        for (const onChangeFn of onChange) {
          // Edit view default onChange is in packages/ui/src/views/Edit/index.tsx. This onChange usually sends a form state request
          serverState = await onChangeFn({
            formState: deepCopyObjectSimpleWithoutReactComponents(formState, {
              excludeFiles: true
            }),
            submitted: submitted_0
          });
        }
        dispatchFields({
          type: 'MERGE_SERVER_STATE',
          prevStateRef: prevFormState,
          serverState
        });
      }
    });
  });
  useDebouncedEffect(() => {
    if ((isFirstRenderRef.current || !dequal(formState, prevFormState.current)) && modified) {
      executeOnChange(submitted);
    }
    prevFormState.current = formState;
    isFirstRenderRef.current = false;
  }, [modified, submitted, formState], 250);
  const DocumentFormContextComponent = isDocumentForm ? DocumentFormContext : React.Fragment;
  const documentFormContextProps = isDocumentForm ? {
    value: contextRef.current
  } : {};
  const El = el || 'form';
  return /*#__PURE__*/_jsx(El, {
    action: typeof action === 'function' ? void action : action,
    className: classes,
    method: method,
    noValidate: true,
    onSubmit: e_0 => void contextRef.current.submit({}, e_0),
    ref: formRef,
    children: /*#__PURE__*/_jsx(DocumentFormContextComponent, {
      ...documentFormContextProps,
      children: /*#__PURE__*/_jsx(FormContext, {
        value: contextRef.current,
        children: /*#__PURE__*/_jsx(FormWatchContext, {
          value: {
            fields: formState,
            ...contextRef.current
          },
          children: /*#__PURE__*/_jsx(SubmittedContext, {
            value: submitted,
            children: /*#__PURE__*/_jsx(InitializingContext, {
              value: !isMounted || isMounted && initializing,
              children: /*#__PURE__*/_jsx(ProcessingContext, {
                value: processing,
                children: /*#__PURE__*/_jsx(BackgroundProcessingContext, {
                  value: backgroundProcessing,
                  children: /*#__PURE__*/_jsx(ModifiedContext, {
                    value: modified,
                    children: /*#__PURE__*/_jsx(FormFieldsContext.Provider, {
                      value: fieldsReducer,
                      children: children
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  });
};
export { DocumentFormContext, FormContext, FormFieldsContext, FormWatchContext, ModifiedContext, ProcessingContext, SubmittedContext, useAllFormFields, useDocumentForm, useForm, useFormFields, useFormModified, useFormProcessing, useFormSubmitted, useWatchForm } from './context.js';
//# sourceMappingURL=index.js.map