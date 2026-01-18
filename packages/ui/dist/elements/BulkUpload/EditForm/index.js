'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo } from 'react';
import { Form, useForm } from '../../../forms/Form/index.js';
import { WatchChildErrors } from '../../../forms/WatchChildErrors/index.js';
import { useConfig } from '../../../providers/Config/index.js';
import { useDocumentEvents } from '../../../providers/DocumentEvents/index.js';
import { useDocumentInfo } from '../../../providers/DocumentInfo/index.js';
import { OperationProvider } from '../../../providers/Operation/index.js';
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js';
import { abortAndIgnore, handleAbortRef } from '../../../utilities/abortAndIgnore.js';
import { useDocumentDrawerContext } from '../../DocumentDrawer/Provider.js';
import { DocumentFields } from '../../DocumentFields/index.js';
import { MoveDocToFolder } from '../../FolderView/MoveDocToFolder/index.js';
import { Upload_v4 } from '../../Upload/index.js';
import { useFormsManager } from '../FormsManager/index.js';
import './index.scss';
const baseClass = 'collection-edit';
// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export function EditForm({
  resetUploadEdits,
  submitted,
  updateUploadEdits,
  uploadEdits
}) {
  const {
    action,
    collectionSlug: docSlug,
    docPermissions,
    getDocPreferences,
    hasSavePermission,
    initialState,
    isInitializing,
    Upload: CustomUpload
  } = useDocumentInfo();
  const {
    drawerSlug,
    onSave: onSaveFromContext
  } = useDocumentDrawerContext();
  const {
    getFormState
  } = useServerFunctions();
  const {
    config: {
      folders
    },
    getEntityConfig
  } = useConfig();
  const abortOnChangeRef = React.useRef(null);
  const collectionConfig = getEntityConfig({
    collectionSlug: docSlug
  });
  const {
    reportUpdate
  } = useDocumentEvents();
  const collectionSlug = collectionConfig.slug;
  const [schemaPath] = React.useState(collectionSlug);
  const onSave = useCallback(json => {
    reportUpdate({
      doc: json?.doc || json?.result,
      drawerSlug,
      entitySlug: collectionSlug,
      operation: 'create',
      updatedAt: json?.result?.updatedAt || new Date().toISOString()
    });
    if (typeof onSaveFromContext === 'function') {
      void onSaveFromContext({
        ...json,
        operation: 'create'
      });
    }
    resetUploadEdits();
  }, [collectionSlug, onSaveFromContext, reportUpdate, resetUploadEdits, drawerSlug]);
  const onChange = useCallback(async ({
    formState: prevFormState,
    submitted: submitted_0
  }) => {
    const controller = handleAbortRef(abortOnChangeRef);
    const docPreferences = await getDocPreferences();
    const {
      state: newFormState
    } = await getFormState({
      collectionSlug,
      docPermissions,
      docPreferences,
      formState: prevFormState,
      operation: 'create',
      schemaPath,
      signal: controller.signal,
      skipValidation: !submitted_0
    });
    abortOnChangeRef.current = null;
    return newFormState;
  }, [collectionSlug, schemaPath, getDocPreferences, getFormState, docPermissions]);
  useEffect(() => {
    const abortOnChange = abortOnChangeRef.current;
    return () => {
      abortAndIgnore(abortOnChange);
    };
  }, []);
  return /*#__PURE__*/_jsx(OperationProvider, {
    operation: "create",
    children: /*#__PURE__*/_jsxs(Form, {
      action: action,
      className: `${baseClass}__form`,
      disabled: isInitializing || !hasSavePermission,
      initialState: isInitializing ? undefined : initialState,
      isInitializing: isInitializing,
      method: "POST",
      onChange: [onChange],
      onSuccess: onSave,
      submitted: submitted,
      children: [/*#__PURE__*/_jsx(DocumentFields, {
        BeforeFields: /*#__PURE__*/_jsx(React.Fragment, {
          children: CustomUpload || /*#__PURE__*/_jsx(Upload_v4, {
            collectionSlug: collectionConfig.slug,
            customActions: [folders && collectionConfig.folders && /*#__PURE__*/_jsx(MoveDocToFolder, {
              buttonProps: {
                buttonStyle: 'pill',
                size: 'small'
              },
              folderCollectionSlug: folders.slug,
              folderFieldName: folders.fieldName
            }, "move-doc-to-folder")].filter(Boolean),
            initialState: initialState,
            resetUploadEdits: resetUploadEdits,
            updateUploadEdits: updateUploadEdits,
            uploadConfig: collectionConfig.upload,
            uploadEdits: uploadEdits
          })
        }),
        docPermissions: docPermissions,
        fields: collectionConfig.fields,
        schemaPathSegments: [collectionConfig.slug]
      }), /*#__PURE__*/_jsx(ReportAllErrors, {}), /*#__PURE__*/_jsx(GetFieldProxy, {})]
    })
  });
}
function GetFieldProxy() {
  const $ = _c(7);
  const {
    getField,
    getFields
  } = useForm();
  const {
    getFormDataRef
  } = useFormsManager();
  let t0;
  if ($[0] !== getFields || $[1] !== getFormDataRef) {
    t0 = () => {
      getFormDataRef.current = getFields;
    };
    $[0] = getFields;
    $[1] = getFormDataRef;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  let t1;
  if ($[3] !== getField || $[4] !== getFields || $[5] !== getFormDataRef) {
    t1 = [getFields, getField, getFormDataRef];
    $[3] = getField;
    $[4] = getFields;
    $[5] = getFormDataRef;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  useEffect(t0, t1);
  return null;
}
function ReportAllErrors() {
  const {
    docConfig
  } = useDocumentInfo();
  const {
    activeIndex,
    forms,
    setFormTotalErrorCount
  } = useFormsManager();
  const errorCountRef = React.useRef(0);
  const fileIsValid = useMemo(() => {
    const currentForm = forms[activeIndex];
    return currentForm?.formState?.file?.valid ?? true;
  }, [activeIndex, forms]);
  const reportFormErrorCount = React.useCallback(fieldErrorCount => {
    let newErrorCount = fieldErrorCount;
    // If the file is invalid, count that as an error
    if (!fileIsValid) {
      newErrorCount += 1;
    }
    if (newErrorCount === errorCountRef.current) {
      return;
    }
    setFormTotalErrorCount({
      errorCount: newErrorCount,
      index: activeIndex
    });
    errorCountRef.current = newErrorCount;
  }, [activeIndex, setFormTotalErrorCount, fileIsValid]);
  if (!docConfig) {
    return null;
  }
  return /*#__PURE__*/_jsx(WatchChildErrors, {
    fields: docConfig.fields,
    path: [],
    setErrorCount: reportFormErrorCount
  });
}
//# sourceMappingURL=index.js.map