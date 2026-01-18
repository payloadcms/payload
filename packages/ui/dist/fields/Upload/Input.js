'use client';

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useModal } from '@faceless-ui/modal';
import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useBulkUpload } from '../../elements/BulkUpload/index.js';
import { Button } from '../../elements/Button/index.js';
import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js';
import { Dropzone } from '../../elements/Dropzone/index.js';
import { useListDrawer } from '../../elements/ListDrawer/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { ShimmerEffect } from '../../elements/ShimmerEffect/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { normalizeRelationshipValue } from '../../utilities/normalizeRelationshipValue.js';
import { fieldBaseClass } from '../shared/index.js';
import { UploadComponentHasMany } from './HasMany/index.js';
import './index.scss';
import { UploadComponentHasOne } from './HasOne/index.js';
export const baseClass = 'upload';
export function UploadInput(props) {
  const {
    AfterInput,
    allowCreate,
    api,
    BeforeInput,
    className,
    Description,
    description,
    displayPreview,
    Error,
    filterOptions: filterOptionsFromProps,
    hasMany,
    isSortable,
    Label,
    label,
    localized,
    maxRows,
    onChange: onChangeFromProps,
    path,
    readOnly,
    relationTo,
    required,
    serverURL,
    showError,
    style,
    value
  } = props;
  const [populatedDocs, setPopulatedDocs] = React.useState();
  const [activeRelationTo] = React.useState(Array.isArray(relationTo) ? relationTo[0] : relationTo);
  const {
    openModal
  } = useModal();
  const {
    drawerSlug,
    setCollectionSlug,
    setInitialFiles,
    setMaxFiles,
    setOnSuccess,
    setSelectableCollections
  } = useBulkUpload();
  const {
    permissions
  } = useAuth();
  const {
    code
  } = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  // This will be used by the bulk upload to allow you to select only collections you have create permissions for
  const collectionSlugsWithCreatePermission = useMemo(() => {
    if (Array.isArray(relationTo)) {
      return relationTo.filter(relation => permissions?.collections && permissions.collections?.[relation]?.create);
    }
    return [];
  }, [relationTo, permissions]);
  const filterOptions = useMemo(() => {
    const isPoly = Array.isArray(relationTo);
    if (!value) {
      return filterOptionsFromProps;
    }
    // Group existing IDs by relation
    const existingIdsByRelation = {};
    const values = Array.isArray(value) ? value : [value];
    for (const val of values) {
      if (isPoly && typeof val === 'object' && 'relationTo' in val) {
        // Poly upload - group by relationTo
        if (!existingIdsByRelation[val.relationTo]) {
          existingIdsByRelation[val.relationTo] = [];
        }
        existingIdsByRelation[val.relationTo].push(val.value);
      } else if (!isPoly) {
        // Non-poly upload - all IDs belong to the single collection
        const collection = relationTo;
        if (!existingIdsByRelation[collection]) {
          existingIdsByRelation[collection] = [];
        }
        const id = typeof val === 'object' && 'value' in val ? val.value : val;
        if (typeof id === 'string' || typeof id === 'number') {
          existingIdsByRelation[collection].push(id);
        }
      }
    }
    // Build filter options for each collection
    const newFilterOptions = {
      ...filterOptionsFromProps
    };
    const relations = isPoly ? relationTo : [relationTo];
    relations.forEach(relation_0 => {
      const existingIds = existingIdsByRelation[relation_0] || [];
      newFilterOptions[relation_0] = {
        ...(filterOptionsFromProps?.[relation_0] || {}),
        id: {
          ...(filterOptionsFromProps?.[relation_0]?.id || {}),
          not_in: (filterOptionsFromProps?.[relation_0]?.id?.not_in || []).concat(existingIds)
        }
      };
    });
    return newFilterOptions;
  }, [value, filterOptionsFromProps, relationTo]);
  const [ListDrawer,, {
    closeDrawer: closeListDrawer,
    openDrawer: openListDrawer
  }] = useListDrawer({
    collectionSlugs: typeof relationTo === 'string' ? [relationTo] : relationTo,
    filterOptions
  });
  const [CreateDocDrawer,, {
    closeDrawer: closeCreateDocDrawer,
    openDrawer: openCreateDocDrawer
  }] = useDocumentDrawer({
    collectionSlug: activeRelationTo
  });
  /**
  * Track the last loaded value to prevent unnecessary reloads
  */
  const loadedValueRef = React.useRef(null);
  const canCreate = useMemo(() => {
    if (!allowCreate) {
      return false;
    }
    if (typeof activeRelationTo === 'string') {
      if (permissions?.collections && permissions.collections?.[activeRelationTo]?.create) {
        return true;
      }
    }
    return false;
  }, [activeRelationTo, permissions, allowCreate]);
  const onChange = React.useCallback(newValue => {
    if (typeof onChangeFromProps === 'function') {
      onChangeFromProps(newValue);
    }
  }, [onChangeFromProps]);
  const populateDocs = React.useCallback(async items => {
    if (!items?.length) {
      return [];
    }
    // 1. Group IDs by collection
    const grouped = {};
    items.forEach(({
      relationTo: relationTo_0,
      value: value_0
    }) => {
      if (!grouped[relationTo_0]) {
        grouped[relationTo_0] = [];
      }
      // Ensure we extract the actual ID value, not an object
      let idValue = value_0;
      if (value_0 && typeof value_0 === 'object' && 'value' in value_0) {
        idValue = value_0.value;
      }
      grouped[relationTo_0].push(idValue);
    });
    // 2. Fetch per collection
    const fetches = Object.entries(grouped).map(async ([collection_0, ids]) => {
      const query = {
        depth: 0,
        draft: true,
        limit: ids.length,
        locale: code,
        where: {
          and: [{
            id: {
              in: ids
            }
          }]
        }
      };
      const response = await fetch(formatAdminURL({
        apiRoute: api,
        path: `/${collection_0}`
      }), {
        body: qs.stringify(query),
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Payload-HTTP-Method-Override': 'GET'
        },
        method: 'POST'
      });
      let docs = [];
      if (response.ok) {
        const data = await response.json();
        docs = data.docs;
      }
      // Map docs by ID for fast lookup
      const docsById = docs.reduce((acc, doc) => {
        acc[doc.id] = doc;
        return acc;
      }, {});
      return {
        collection: collection_0,
        docsById
      };
    });
    const results = await Promise.all(fetches);
    // 3. Build lookup
    const lookup = {};
    results.forEach(({
      collection: collection_1,
      docsById: docsById_0
    }) => {
      lookup[collection_1] = docsById_0;
    });
    // 4. Reconstruct in input order, add placeholders if missing
    const sortedDocs = items.map(({
      relationTo: relationTo_1,
      value: value_1
    }) => {
      const doc_0 = lookup[relationTo_1]?.[value_1] || {
        id: value_1,
        filename: `${t('general:untitled')} - ID: ${value_1}`,
        isPlaceholder: true
      };
      return {
        relationTo: relationTo_1,
        value: doc_0
      };
    });
    return sortedDocs;
  }, [api, code, i18n.language, t]);
  const normalizeValue = useCallback(value_2 => normalizeRelationshipValue(value_2, relationTo), [relationTo]);
  const onUploadSuccess = useCallback(uploadedForms => {
    const isPoly_0 = Array.isArray(relationTo);
    if (hasMany) {
      const newValues = uploadedForms.map(form => isPoly_0 ? {
        relationTo: form.collectionSlug,
        value: form.doc.id
      } : form.doc.id);
      // Normalize existing values before merging
      const normalizedExisting = Array.isArray(value) ? value.map(normalizeValue) : [];
      const mergedValue = [...normalizedExisting, ...newValues];
      onChange(mergedValue);
      setPopulatedDocs(currentDocs => [...(currentDocs || []), ...uploadedForms.map(form_0 => ({
        relationTo: form_0.collectionSlug,
        value: form_0.doc
      }))]);
    } else {
      const firstDoc = uploadedForms[0];
      const newValue_0 = isPoly_0 ? {
        relationTo: firstDoc.collectionSlug,
        value: firstDoc.doc.id
      } : firstDoc.doc.id;
      onChange(newValue_0);
      setPopulatedDocs([{
        relationTo: firstDoc.collectionSlug,
        value: firstDoc.doc
      }]);
    }
  }, [value, onChange, hasMany, relationTo, normalizeValue]);
  const onLocalFileSelection = React.useCallback(fileList => {
    let fileListToUse = fileList;
    if (!hasMany && fileList && fileList.length > 1) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(fileList[0]);
      fileListToUse = dataTransfer.files;
    }
    if (fileListToUse) {
      setInitialFiles(fileListToUse);
    }
    // Use activeRelationTo for poly uploads, or relationTo as string for single collection
    const collectionToUse = Array.isArray(relationTo) ? activeRelationTo : relationTo;
    setCollectionSlug(collectionToUse);
    if (Array.isArray(collectionSlugsWithCreatePermission)) {
      setSelectableCollections(collectionSlugsWithCreatePermission);
    }
    if (typeof maxRows === 'number') {
      setMaxFiles(maxRows);
    }
    openModal(drawerSlug);
  }, [hasMany, relationTo, activeRelationTo, setCollectionSlug, collectionSlugsWithCreatePermission, maxRows, openModal, drawerSlug, setInitialFiles, setSelectableCollections, setMaxFiles]);
  // only hasMany can bulk select
  const onListBulkSelect = React.useCallback(async docs_0 => {
    const isPoly_1 = Array.isArray(relationTo);
    const selectedDocIDs = [];
    for (const [id_0, isSelected] of docs_0) {
      if (isSelected) {
        selectedDocIDs.push(id_0);
      }
    }
    const itemsToLoad = selectedDocIDs.map(id_1 => ({
      relationTo: activeRelationTo,
      value: id_1
    }));
    const loadedDocs = await populateDocs(itemsToLoad);
    if (loadedDocs) {
      setPopulatedDocs(currentDocs_0 => [...(currentDocs_0 || []), ...loadedDocs]);
    }
    const newValues_0 = selectedDocIDs.map(id_2 => isPoly_1 ? {
      relationTo: activeRelationTo,
      value: id_2
    } : id_2);
    // Normalize existing values before merging
    const normalizedExisting_0 = Array.isArray(value) ? value.map(normalizeValue) : [];
    onChange([...normalizedExisting_0, ...newValues_0]);
    closeListDrawer();
  }, [activeRelationTo, closeListDrawer, onChange, populateDocs, value, relationTo, normalizeValue]);
  const onDocCreate = React.useCallback(data_0 => {
    const isPoly_2 = Array.isArray(relationTo);
    if (data_0.doc) {
      setPopulatedDocs(currentDocs_1 => [...(currentDocs_1 || []), {
        relationTo: activeRelationTo,
        value: data_0.doc
      }]);
      const newValue_1 = isPoly_2 ? {
        relationTo: activeRelationTo,
        value: data_0.doc.id
      } : data_0.doc.id;
      onChange(newValue_1);
    }
    closeCreateDocDrawer();
  }, [closeCreateDocDrawer, activeRelationTo, onChange, relationTo]);
  const onListSelect = useCallback(async ({
    collectionSlug,
    doc: doc_1
  }) => {
    const isPoly_3 = Array.isArray(relationTo);
    const loadedDocs_0 = await populateDocs([{
      relationTo: collectionSlug,
      value: doc_1.id
    }]);
    const selectedDoc = loadedDocs_0?.[0] || null;
    setPopulatedDocs(currentDocs_2 => {
      if (selectedDoc) {
        if (hasMany) {
          return [...(currentDocs_2 || []), selectedDoc];
        }
        return [selectedDoc];
      }
      return currentDocs_2;
    });
    if (hasMany) {
      const newValue_2 = isPoly_3 ? {
        relationTo: collectionSlug,
        value: doc_1.id
      } : doc_1.id;
      // Normalize existing values before merging
      const normalizedExisting_1 = Array.isArray(value) ? value.map(normalizeValue) : [];
      const valueToUse = [...normalizedExisting_1, newValue_2];
      onChange(valueToUse);
    } else {
      const valueToUse_0 = isPoly_3 ? {
        relationTo: collectionSlug,
        value: doc_1.id
      } : doc_1.id;
      onChange(valueToUse_0);
    }
    closeListDrawer();
  }, [closeListDrawer, hasMany, populateDocs, onChange, value, relationTo, normalizeValue]);
  const reloadDoc = React.useCallback(async (docID, collectionSlug_0) => {
    const docs_1 = await populateDocs([{
      relationTo: collectionSlug_0,
      value: docID
    }]);
    if (docs_1[0]) {
      let updatedDocsToPropogate = [];
      setPopulatedDocs(currentDocs_3 => {
        const existingDocIndex = currentDocs_3?.findIndex(doc_2 => {
          const hasExisting = doc_2.value?.id === docs_1[0].value.id || doc_2.value?.isPlaceholder;
          return hasExisting && doc_2.relationTo === collectionSlug_0;
        });
        if (existingDocIndex > -1) {
          const updatedDocs = [...currentDocs_3];
          updatedDocs[existingDocIndex] = docs_1[0];
          updatedDocsToPropogate = updatedDocs;
          return updatedDocs;
        }
        return currentDocs_3;
      });
      if (updatedDocsToPropogate.length && hasMany) {
        onChange(updatedDocsToPropogate.map(doc_3 => doc_3.value?.id));
      }
    }
  }, [populateDocs, onChange, hasMany]);
  // only hasMany can reorder
  const onReorder = React.useCallback(newValue_3 => {
    const isPoly_4 = Array.isArray(relationTo);
    const newValueToSave = newValue_3.map(({
      relationTo: rel,
      value: value_3
    }) => isPoly_4 ? {
      relationTo: rel,
      value: value_3.id
    } : value_3.id);
    onChange(newValueToSave);
    setPopulatedDocs(newValue_3);
  }, [onChange, relationTo]);
  const onRemove = React.useCallback(newValue_4 => {
    const isPoly_5 = Array.isArray(relationTo);
    if (!newValue_4 || newValue_4.length === 0) {
      onChange(hasMany ? [] : null);
      setPopulatedDocs(hasMany ? [] : null);
      return;
    }
    const newValueToSave_0 = newValue_4.map(({
      relationTo: rel_0,
      value: value_4
    }) => isPoly_5 ? {
      relationTo: rel_0,
      value: value_4.id
    } : value_4.id);
    onChange(hasMany ? newValueToSave_0 : newValueToSave_0[0]);
    setPopulatedDocs(newValue_4);
  }, [onChange, hasMany, relationTo]);
  useEffect(() => {
    async function loadInitialDocs() {
      if (value) {
        let itemsToLoad_0 = [];
        if (Array.isArray(relationTo) && (typeof value === 'object' && 'relationTo' in value || Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'relationTo' in value[0])) {
          // For poly uploads, value should already be in the format { relationTo, value }
          const values_0 = Array.isArray(value) ? value : [value];
          itemsToLoad_0 = values_0.filter(v => typeof v === 'object' && 'relationTo' in v).map(v_0 => {
            // Ensure the value property is a simple ID, not nested
            let idValue_0 = v_0.value;
            while (idValue_0 && typeof idValue_0 === 'object' && idValue_0 !== null && 'value' in idValue_0) {
              idValue_0 = idValue_0.value;
            }
            return {
              relationTo: v_0.relationTo,
              value: idValue_0
            };
          });
        } else {
          // This check is here to satisfy TypeScript that relationTo is a string
          if (!Array.isArray(relationTo)) {
            // For single collection uploads, we need to wrap the IDs
            const ids_0 = Array.isArray(value) ? value : [value];
            itemsToLoad_0 = ids_0.map(id_3 => {
              // Extract the actual ID, handling nested objects
              let idValue_1 = id_3;
              while (idValue_1 && typeof idValue_1 === 'object' && idValue_1 !== null && 'value' in idValue_1) {
                idValue_1 = idValue_1.value;
              }
              return {
                relationTo,
                value: idValue_1
              };
            });
          }
        }
        if (itemsToLoad_0.length > 0) {
          const loadedDocs_1 = await populateDocs(itemsToLoad_0);
          if (loadedDocs_1) {
            setPopulatedDocs(loadedDocs_1);
            loadedValueRef.current = value;
          }
        }
      } else {
        // Clear populated docs when value is cleared
        setPopulatedDocs([]);
        loadedValueRef.current = null;
      }
    }
    // Only load if value has changed from what we last loaded
    const valueChanged = loadedValueRef.current !== value;
    if (valueChanged) {
      void loadInitialDocs();
    }
  }, [populateDocs, value, relationTo]);
  useEffect(() => {
    setOnSuccess(onUploadSuccess);
  }, [value, path, onUploadSuccess, setOnSuccess]);
  const showDropzone = !value || hasMany && Array.isArray(value) && (typeof maxRows !== 'number' || value.length < maxRows) || !hasMany && populatedDocs?.[0] && typeof populatedDocs[0].value === 'undefined';
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, showError && 'error', readOnly && 'read-only'].filter(Boolean).join(' '),
    id: `field-${path?.replace(/\./g, '__')}`,
    style: style,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Label,
      Fallback: /*#__PURE__*/_jsx(FieldLabel, {
        label: label,
        localized: localized,
        path: path,
        required: required
      })
    }), /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__wrap`,
      children: /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Error,
        Fallback: /*#__PURE__*/_jsx(FieldError, {
          path: path,
          showError: showError
        })
      })
    }), BeforeInput, /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__dropzoneAndUpload`,
      children: [hasMany && Array.isArray(value) && value.length > 0 ? /*#__PURE__*/_jsx(_Fragment, {
        children: populatedDocs && populatedDocs?.length > 0 ? /*#__PURE__*/_jsx(UploadComponentHasMany, {
          displayPreview: displayPreview,
          fileDocs: populatedDocs,
          isSortable: isSortable && !readOnly,
          onRemove: onRemove,
          onReorder: onReorder,
          readonly: readOnly,
          reloadDoc: reloadDoc,
          serverURL: serverURL,
          showCollectionSlug: Array.isArray(relationTo)
        }) : /*#__PURE__*/_jsx("div", {
          className: `${baseClass}__loadingRows`,
          children: value.map(id_4 => /*#__PURE__*/_jsx(ShimmerEffect, {
            height: "40px"
          }, typeof id_4 === 'object' ? id_4.value : id_4))
        })
      }) : null, !hasMany && value ? /*#__PURE__*/_jsx(_Fragment, {
        children: populatedDocs && populatedDocs?.length > 0 && populatedDocs[0].value ? /*#__PURE__*/_jsx(UploadComponentHasOne, {
          displayPreview: displayPreview,
          fileDoc: populatedDocs[0],
          onRemove: onRemove,
          readonly: readOnly,
          reloadDoc: reloadDoc,
          serverURL: serverURL,
          showCollectionSlug: Array.isArray(relationTo)
        }) : populatedDocs && value && !populatedDocs?.[0]?.value ? /*#__PURE__*/_jsxs(_Fragment, {
          children: [t('general:untitled'), " - ID: ", value]
        }) : /*#__PURE__*/_jsx(ShimmerEffect, {
          height: "62px"
        })
      }) : null, showDropzone ? /*#__PURE__*/_jsx(Dropzone, {
        disabled: readOnly || !canCreate,
        multipleFiles: hasMany,
        onChange: onLocalFileSelection,
        children: /*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__dropzoneContent`,
          children: [/*#__PURE__*/_jsxs("div", {
            className: `${baseClass}__dropzoneContent__buttons`,
            children: [canCreate && /*#__PURE__*/_jsxs(_Fragment, {
              children: [/*#__PURE__*/_jsx(Button, {
                buttonStyle: "pill",
                className: `${baseClass}__createNewToggler`,
                disabled: readOnly || !canCreate,
                onClick: () => {
                  if (!readOnly) {
                    if (hasMany) {
                      onLocalFileSelection();
                    } else {
                      openCreateDocDrawer();
                    }
                  }
                },
                size: "small",
                children: t('general:createNew')
              }), /*#__PURE__*/_jsx("span", {
                className: `${baseClass}__dropzoneContent__orText`,
                children: t('general:or')
              })]
            }), /*#__PURE__*/_jsx(Button, {
              buttonStyle: "pill",
              className: `${baseClass}__listToggler`,
              disabled: readOnly,
              onClick: openListDrawer,
              size: "small",
              children: t('fields:chooseFromExisting')
            }), /*#__PURE__*/_jsx(CreateDocDrawer, {
              onSave: onDocCreate
            }), /*#__PURE__*/_jsx(ListDrawer, {
              allowCreate: canCreate,
              enableRowSelections: hasMany,
              onBulkSelect: onListBulkSelect,
              onSelect: onListSelect
            })]
          }), canCreate && !readOnly && /*#__PURE__*/_jsxs("p", {
            className: `${baseClass}__dragAndDropText`,
            children: [t('general:or'), " ", t('upload:dragAndDrop')]
          })]
        })
      }) : /*#__PURE__*/_jsx(_Fragment, {
        children: !readOnly && !populatedDocs && (!value || typeof maxRows !== 'number' || Array.isArray(value) && value.length < maxRows) ? /*#__PURE__*/_jsx(ShimmerEffect, {
          height: "40px"
        }) : null
      })]
    }), AfterInput, /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Description,
      Fallback: /*#__PURE__*/_jsx(FieldDescription, {
        description: description,
        path: path
      })
    })]
  });
}
//# sourceMappingURL=Input.js.map