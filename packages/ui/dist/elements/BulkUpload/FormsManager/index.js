'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
import React from 'react';
import { toast } from 'sonner';
import { fieldReducer } from '../../../forms/Form/fieldReducer.js';
import { useEffectEvent } from '../../../hooks/useEffectEvent.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useLocale } from '../../../providers/Locale/index.js';
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js';
import { useTranslation } from '../../../providers/Translation/index.js';
import { useUploadHandlers } from '../../../providers/UploadHandlers/index.js';
import { hasSavePermission as getHasSavePermission } from '../../../utilities/hasSavePermission.js';
import { LoadingOverlay } from '../../Loading/index.js';
import { useLoadingOverlay } from '../../LoadingOverlay/index.js';
import { useBulkUpload } from '../index.js';
import { createFormData } from './createFormData.js';
import { formsManagementReducer } from './reducer.js';
const Context = /*#__PURE__*/React.createContext({
  activeIndex: 0,
  addFiles: () => Promise.resolve(),
  bulkUpdateForm: () => null,
  collectionSlug: '',
  docPermissions: undefined,
  documentSlots: {},
  forms: [],
  getFormDataRef: {
    current: () => ({})
  },
  hasPublishPermission: false,
  hasSavePermission: false,
  hasSubmitted: false,
  isInitializing: false,
  removeFile: () => {},
  saveAllDocs: () => Promise.resolve(),
  setActiveIndex: () => 0,
  setFormTotalErrorCount: () => {},
  totalErrorCount: 0,
  updateUploadEdits: () => {}
});
const initialState = {
  activeIndex: 0,
  forms: [],
  totalErrorCount: 0
};
export function FormsManagerProvider({
  children
}) {
  const {
    config
  } = useConfig();
  const {
    routes: {
      api
    }
  } = config;
  const {
    code
  } = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    getDocumentSlots,
    getFormState
  } = useServerFunctions();
  const {
    getUploadHandler
  } = useUploadHandlers();
  const [documentSlots, setDocumentSlots] = React.useState({});
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [docPermissions, setDocPermissions] = React.useState();
  const [hasSavePermission, setHasSavePermission] = React.useState(false);
  const [hasPublishPermission, setHasPublishPermission] = React.useState(false);
  const [hasInitializedState, setHasInitializedState] = React.useState(false);
  const [hasInitializedDocPermissions, setHasInitializedDocPermissions] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [state, dispatch] = React.useReducer(formsManagementReducer, initialState);
  const {
    activeIndex,
    forms,
    totalErrorCount
  } = state;
  const formsRef = React.useRef(forms);
  formsRef.current = forms;
  const {
    toggleLoadingOverlay
  } = useLoadingOverlay();
  const {
    closeModal
  } = useModal();
  const {
    collectionSlug,
    drawerSlug,
    initialFiles,
    initialForms,
    onSuccess,
    setInitialFiles,
    setInitialForms,
    setSuccessfullyUploaded
  } = useBulkUpload();
  const [isUploading, setIsUploading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('');
  const hasInitializedWithFiles = React.useRef(false);
  const initialStateRef = React.useRef(null);
  const getFormDataRef = React.useRef(() => ({}));
  const baseAPIPath = formatAdminURL({
    apiRoute: api,
    path: ''
  });
  const actionURL = `${baseAPIPath}/${collectionSlug}`;
  const initializeSharedDocPermissions = React.useCallback(async () => {
    const params = {
      locale: code || undefined
    };
    const docAccessURL = `/${collectionSlug}/access`;
    const res = await fetch(`${baseAPIPath}${docAccessURL}?${qs.stringify(params)}`, {
      credentials: 'include',
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json'
      },
      method: 'post'
    });
    const json = await res.json();
    const publishedAccessJSON = await fetch(`${baseAPIPath}${docAccessURL}?${qs.stringify(params)}`, {
      body: JSON.stringify({
        _status: 'published'
      }),
      credentials: 'include',
      headers: {
        'Accept-Language': i18n.language,
        'Content-Type': 'application/json'
      },
      method: 'POST'
    }).then(res_0 => res_0.json());
    setDocPermissions(json);
    setHasSavePermission(getHasSavePermission({
      collectionSlug,
      docPermissions: json,
      isEditing: false
    }));
    setHasPublishPermission(publishedAccessJSON?.update);
    setHasInitializedDocPermissions(true);
  }, [baseAPIPath, code, collectionSlug, i18n.language]);
  const initializeSharedFormState = React.useCallback(async abortController => {
    if (abortController?.signal) {
      abortController.abort('aborting previous fetch for initial form state without files');
    }
    // FETCH AND SET THE DOCUMENT SLOTS HERE!
    const documentSlots_0 = await getDocumentSlots({
      collectionSlug
    });
    setDocumentSlots(documentSlots_0);
    try {
      const {
        state: formStateWithoutFiles
      } = await getFormState({
        collectionSlug,
        docPermissions,
        docPreferences: {
          fields: {}
        },
        locale: code,
        operation: 'create',
        renderAllFields: true,
        schemaPath: collectionSlug,
        skipValidation: true
      });
      initialStateRef.current = formStateWithoutFiles;
      setHasInitializedState(true);
    } catch (_err) {
      // swallow error
    }
  }, [getDocumentSlots, collectionSlug, getFormState, docPermissions, code]);
  const setActiveIndex = React.useCallback(index => {
    const currentFormsData = getFormDataRef.current();
    dispatch({
      type: 'REPLACE',
      state: {
        activeIndex: index,
        forms: forms.map((form, i) => {
          if (i === activeIndex) {
            return {
              errorCount: form.errorCount,
              formID: form.formID,
              formState: currentFormsData,
              uploadEdits: form.uploadEdits
            };
          }
          return form;
        })
      }
    });
  }, [forms, activeIndex]);
  const addFiles = React.useCallback(async files => {
    if (forms.length) {
      // save the state of the current form before adding new files
      dispatch({
        type: 'UPDATE_FORM',
        errorCount: forms[activeIndex].errorCount,
        formState: getFormDataRef.current(),
        index: activeIndex
      });
    }
    toggleLoadingOverlay({
      isLoading: true,
      key: 'addingDocs'
    });
    if (!hasInitializedState) {
      await initializeSharedFormState();
    }
    dispatch({
      type: 'ADD_FORMS',
      forms: Array.from(files).map(file => ({
        file,
        initialState: initialStateRef.current
      }))
    });
    toggleLoadingOverlay({
      isLoading: false,
      key: 'addingDocs'
    });
  }, [initializeSharedFormState, hasInitializedState, toggleLoadingOverlay, activeIndex, forms]);
  const addFilesEffectEvent = useEffectEvent(addFiles);
  const addInitialForms = useEffectEvent(async initialForms_0 => {
    toggleLoadingOverlay({
      isLoading: true,
      key: 'addingDocs'
    });
    if (!hasInitializedState) {
      await initializeSharedFormState();
    }
    dispatch({
      type: 'ADD_FORMS',
      forms: initialForms_0.map(form_0 => ({
        ...form_0,
        initialState: form_0?.initialState || initialStateRef.current
      }))
    });
    toggleLoadingOverlay({
      isLoading: false,
      key: 'addingDocs'
    });
  });
  const removeFile = React.useCallback(index_0 => {
    dispatch({
      type: 'REMOVE_FORM',
      index: index_0
    });
  }, []);
  const setFormTotalErrorCount = React.useCallback(({
    errorCount,
    index: index_1
  }) => {
    dispatch({
      type: 'UPDATE_ERROR_COUNT',
      count: errorCount,
      index: index_1
    });
  }, []);
  const saveAllDocs = React.useCallback(async ({
    overrides
  } = {}) => {
    const currentFormsData_0 = getFormDataRef.current();
    const currentForms = [...forms];
    currentForms[activeIndex] = {
      errorCount: currentForms[activeIndex].errorCount,
      formID: currentForms[activeIndex].formID,
      formState: currentFormsData_0,
      uploadEdits: currentForms[activeIndex].uploadEdits
    };
    const activeFormID = currentForms[activeIndex]?.formID;
    const newDocs = [];
    setIsUploading(true);
    for (let i_0 = 0; i_0 < currentForms.length; i_0++) {
      try {
        const form_1 = currentForms[i_0];
        const fileValue = form_1.formState?.file?.value;
        setLoadingText(t('general:uploadingBulk', {
          current: i_0 + 1,
          total: currentForms.length
        }));
        const actionURLWithParams = `${actionURL}${qs.stringify({
          locale: code,
          uploadEdits: form_1?.uploadEdits || undefined
        }, {
          addQueryPrefix: true
        })}`;
        const req = await fetch(actionURLWithParams, {
          body: await createFormData(form_1.formState, overrides, collectionSlug, getUploadHandler({
            collectionSlug
          })),
          credentials: 'include',
          method: 'POST'
        });
        const json_0 = await req.json();
        if (req.status === 201 && json_0?.doc) {
          newDocs.push({
            collectionSlug,
            doc: json_0.doc,
            formID: form_1.formID
          });
        }
        // should expose some sort of helper for this
        const [fieldErrors, nonFieldErrors] = (json_0?.errors || []).reduce(([fieldErrs, nonFieldErrs], err) => {
          const newFieldErrs = [];
          const newNonFieldErrs = [];
          if (err?.message) {
            newNonFieldErrs.push(err);
          }
          if (Array.isArray(err?.data?.errors)) {
            err.data?.errors.forEach(dataError => {
              if (dataError?.path) {
                newFieldErrs.push(dataError);
              } else {
                newNonFieldErrs.push(dataError);
              }
            });
          }
          return [[...fieldErrs, ...newFieldErrs], [...nonFieldErrs, ...newNonFieldErrs]];
        }, [[], []]);
        const missingFile = !fileValue && req.status === 400;
        const exceedsLimit = fileValue && req.status === 413;
        const missingFilename = fileValue && typeof fileValue === 'object' && 'name' in fileValue && (!fileValue.name || fileValue.name === '');
        if (missingFile || exceedsLimit || missingFilename) {
          currentForms[i_0].formState.file.valid = false;
          // neeed to get the field state to extract count since field errors
          // are not returned when file is missing or exceeds limit
          const {
            state: newState
          } = await getFormState({
            collectionSlug,
            docPermissions,
            docPreferences: null,
            formState: currentForms[i_0].formState,
            operation: 'update',
            schemaPath: collectionSlug
          });
          currentForms[i_0] = {
            errorCount: Object.values(newState).reduce((acc, value) => value?.valid === false ? acc + 1 : acc, 0),
            formID: currentForms[i_0].formID,
            formState: newState
          };
          toast.error(nonFieldErrors[0]?.message);
        } else {
          currentForms[i_0] = {
            errorCount: fieldErrors.length,
            formID: currentForms[i_0].formID,
            formState: fieldReducer(currentForms[i_0].formState, {
              type: 'ADD_SERVER_ERRORS',
              errors: fieldErrors
            })
          };
        }
      } catch (_) {
        // swallow
      }
    }
    setHasSubmitted(true);
    setLoadingText('');
    setIsUploading(false);
    const remainingForms = [];
    currentForms.forEach(({
      errorCount: errorCount_0
    }, i_1) => {
      if (errorCount_0) {
        remainingForms.push(currentForms[i_1]);
      }
    });
    const successCount = Math.max(0, currentForms.length - remainingForms.length);
    const errorCount_1 = currentForms.length - successCount;
    if (successCount) {
      toast.success(`Successfully saved ${successCount} files`);
      setSuccessfullyUploaded(true);
      if (typeof onSuccess === 'function') {
        onSuccess(newDocs, errorCount_1);
      }
    }
    if (errorCount_1) {
      toast.error(`Failed to save ${errorCount_1} files`);
    } else {
      closeModal(drawerSlug);
    }
    dispatch({
      type: 'REPLACE',
      state: {
        activeIndex: remainingForms.reduce((acc_0, {
          formID
        }, i_2) => {
          if (formID === activeFormID) {
            return i_2;
          }
          return acc_0;
        }, 0),
        forms: remainingForms,
        totalErrorCount: remainingForms.reduce((acc_1, {
          errorCount: errorCount_2
        }) => acc_1 + errorCount_2, 0)
      }
    });
    if (remainingForms.length === 0) {
      setInitialFiles(undefined);
      setInitialForms(undefined);
    }
  }, [forms, activeIndex, t, actionURL, code, collectionSlug, getUploadHandler, getFormState, docPermissions, setSuccessfullyUploaded, onSuccess, closeModal, drawerSlug, setInitialFiles, setInitialForms]);
  const bulkUpdateForm = React.useCallback(async (updatedFields, afterStateUpdate) => {
    for (let i_3 = 0; i_3 < forms.length; i_3++) {
      Object.entries(updatedFields).forEach(([path, value_0]) => {
        if (forms[i_3].formState[path]) {
          forms[i_3].formState[path].value = value_0;
          dispatch({
            type: 'UPDATE_FORM',
            errorCount: forms[i_3].errorCount,
            formState: forms[i_3].formState,
            index: i_3
          });
        }
      });
      if (typeof afterStateUpdate === 'function') {
        afterStateUpdate();
      }
      if (hasSubmitted) {
        const {
          state: state_0
        } = await getFormState({
          collectionSlug,
          docPermissions,
          docPreferences: null,
          formState: forms[i_3].formState,
          operation: 'create',
          schemaPath: collectionSlug
        });
        const newFormErrorCount = Object.values(state_0).reduce((acc_2, value_1) => value_1?.valid === false ? acc_2 + 1 : acc_2, 0);
        dispatch({
          type: 'UPDATE_FORM',
          errorCount: newFormErrorCount,
          formState: state_0,
          index: i_3
        });
      }
    }
  }, [collectionSlug, docPermissions, forms, getFormState, hasSubmitted]);
  const updateUploadEdits = React.useCallback(uploadEdits => {
    dispatch({
      type: 'UPDATE_FORM',
      errorCount: forms[activeIndex].errorCount,
      formState: forms[activeIndex].formState,
      index: activeIndex,
      uploadEdits
    });
  }, [activeIndex, forms]);
  const resetUploadEdits = React.useCallback(() => {
    dispatch({
      type: 'REPLACE',
      state: {
        forms: forms.map(form_2 => ({
          ...form_2,
          uploadEdits: {}
        }))
      }
    });
  }, [forms]);
  React.useEffect(() => {
    if (!collectionSlug) {
      return;
    }
    if (!hasInitializedState) {
      void initializeSharedFormState();
    }
    if (!hasInitializedDocPermissions) {
      void initializeSharedDocPermissions();
    }
    if (initialFiles || initialForms) {
      if (!hasInitializedState || !hasInitializedDocPermissions) {
        setIsInitializing(true);
      } else {
        setIsInitializing(false);
      }
    }
    if (hasInitializedState && (initialForms?.length || initialFiles?.length) && !hasInitializedWithFiles.current) {
      if (initialForms?.length) {
        void addInitialForms(initialForms);
      }
      if (initialFiles?.length) {
        void addFilesEffectEvent(initialFiles);
      }
      hasInitializedWithFiles.current = true;
    }
    return;
  }, [initialFiles, initializeSharedFormState, initializeSharedDocPermissions, collectionSlug, hasInitializedState, hasInitializedDocPermissions, initialForms]);
  return /*#__PURE__*/_jsxs(Context, {
    value: {
      activeIndex: state.activeIndex,
      addFiles,
      bulkUpdateForm,
      collectionSlug,
      docPermissions,
      documentSlots,
      forms,
      getFormDataRef,
      hasPublishPermission,
      hasSavePermission,
      hasSubmitted,
      isInitializing,
      removeFile,
      resetUploadEdits,
      saveAllDocs,
      setActiveIndex,
      setFormTotalErrorCount,
      totalErrorCount,
      updateUploadEdits
    },
    children: [isUploading && /*#__PURE__*/_jsx(LoadingOverlay, {
      animationDuration: "250ms",
      loadingText: loadingText,
      overlayType: "fullscreen",
      show: true
    }), children]
  });
}
export function useFormsManager() {
  return React.use(Context);
}
//# sourceMappingURL=index.js.map