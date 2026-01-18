'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React, { Fragment, useCallback, useId, useMemo } from 'react';
import { toast } from 'sonner';
import { Banner } from '../../elements/Banner/index.js';
import { Button } from '../../elements/Button/index.js';
import { clipboardCopy, clipboardPaste } from '../../elements/ClipboardAction/clipboardUtilities.js';
import { ClipboardAction } from '../../elements/ClipboardAction/index.js';
import { mergeFormStateFromClipboard, reduceFormStateByPath } from '../../elements/ClipboardAction/mergeFormStateFromClipboard.js';
import { DraggableSortableItem } from '../../elements/DraggableSortable/DraggableSortableItem/index.js';
import { DraggableSortable } from '../../elements/DraggableSortable/index.js';
import { ErrorPill } from '../../elements/ErrorPill/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useForm, useFormSubmitted } from '../../forms/Form/context.js';
import { extractRowsAndCollapsedIDs, toggleAllRows } from '../../forms/Form/rowHelpers.js';
import { NullifyLocaleField } from '../../forms/NullifyField/index.js';
import { useField } from '../../forms/useField/index.js';
import { withCondition } from '../../forms/withCondition/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { scrollToID } from '../../utilities/scrollToID.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import { fieldBaseClass } from '../shared/index.js';
import { ArrayRow } from './ArrayRow.js';
import './index.scss';
const baseClass = 'array-field';
export const ArrayFieldComponent = props => {
  const {
    field,
    field: {
      name,
      type,
      admin: {
        className,
        description,
        isSortable = true
      } = {},
      fields,
      label,
      localized,
      maxRows,
      minRows: minRowsProp,
      required
    },
    forceRender = false,
    path: pathFromProps,
    permissions,
    readOnly,
    schemaPath: schemaPathFromProps,
    validate
  } = props;
  const schemaPath = schemaPathFromProps ?? name;
  const minRows = minRowsProp ?? (required ? 1 : 0);
  const {
    setDocFieldPreferences
  } = useDocumentInfo();
  const {
    addFieldRow,
    dispatchFields,
    getFields,
    moveFieldRow,
    removeFieldRow,
    replaceState,
    setModified
  } = useForm();
  const submitted = useFormSubmitted();
  const {
    code: locale
  } = useLocale();
  const {
    i18n,
    t
  } = useTranslation();
  const {
    config: {
      localization
    }
  } = useConfig();
  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale;
      return locale === defaultLocale;
    }
    return true;
  })();
  // Handle labeling for Arrays, Global Arrays, and Blocks
  const getLabels = p => {
    if ('labels' in p && p?.labels) {
      return p.labels;
    }
    if ('labels' in p.field && p.field.labels) {
      return {
        plural: p.field.labels?.plural,
        singular: p.field.labels?.singular
      };
    }
    if ('label' in p.field && p.field.label) {
      return {
        plural: undefined,
        singular: p.field.label
      };
    }
    return {
      plural: t('general:rows'),
      singular: t('general:row')
    };
  };
  const labels = getLabels(props);
  const memoizedValidate = useCallback((value, options) => {
    // alternative locales can be null
    if (!editingDefaultLocale && value === null) {
      return true;
    }
    if (typeof validate === 'function') {
      return validate(value, {
        ...options,
        maxRows,
        minRows,
        required
      });
    }
  }, [maxRows, minRows, required, validate, editingDefaultLocale]);
  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled,
    errorPaths,
    path,
    rows = [],
    showError,
    valid,
    value: value_0
  } = useField({
    hasRows: true,
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });
  const componentId = useId();
  const scrollIdPrefix = useMemo(() => `scroll-${componentId}`, [componentId]);
  const addRow = useCallback(rowIndex => {
    addFieldRow({
      path,
      rowIndex,
      schemaPath
    });
    setTimeout(() => {
      scrollToID(`${scrollIdPrefix}-row-${rowIndex}`);
    }, 0);
  }, [addFieldRow, path, schemaPath, scrollIdPrefix]);
  const duplicateRow = useCallback(rowIndex_0 => {
    dispatchFields({
      type: 'DUPLICATE_ROW',
      path,
      rowIndex: rowIndex_0
    });
    setModified(true);
    setTimeout(() => {
      scrollToID(`${scrollIdPrefix}-row-${rowIndex_0}`);
    }, 0);
  }, [dispatchFields, path, scrollIdPrefix, setModified]);
  const removeRow = useCallback(rowIndex_1 => {
    removeFieldRow({
      path,
      rowIndex: rowIndex_1
    });
  }, [removeFieldRow, path]);
  const moveRow = useCallback((moveFromIndex, moveToIndex) => {
    moveFieldRow({
      moveFromIndex,
      moveToIndex,
      path
    });
  }, [path, moveFieldRow]);
  const toggleCollapseAll = useCallback(collapsed => {
    const {
      collapsedIDs,
      updatedRows
    } = toggleAllRows({
      collapsed,
      rows
    });
    setDocFieldPreferences(path, {
      collapsed: collapsedIDs
    });
    dispatchFields({
      type: 'SET_ALL_ROWS_COLLAPSED',
      path,
      updatedRows
    });
  }, [dispatchFields, path, rows, setDocFieldPreferences]);
  const setCollapse = useCallback((rowID, collapsed_0) => {
    const {
      collapsedIDs: collapsedIDs_0,
      updatedRows: updatedRows_0
    } = extractRowsAndCollapsedIDs({
      collapsed: collapsed_0,
      rowID,
      rows
    });
    dispatchFields({
      type: 'SET_ROW_COLLAPSED',
      path,
      updatedRows: updatedRows_0
    });
    setDocFieldPreferences(path, {
      collapsed: collapsedIDs_0
    });
  }, [dispatchFields, path, rows, setDocFieldPreferences]);
  const copyRow = useCallback(rowIndex_2 => {
    const formState = {
      ...getFields()
    };
    const clipboardResult = clipboardCopy({
      type,
      fields,
      getDataToCopy: () => reduceFormStateByPath({
        formState,
        path,
        rowIndex: rowIndex_2
      }),
      path,
      rowIndex: rowIndex_2,
      t
    });
    if (typeof clipboardResult === 'string') {
      toast.error(clipboardResult);
    } else {
      toast.success(t('general:copied'));
    }
  }, [fields, getFields, path, t, type]);
  const pasteRow = useCallback(rowIndex_3 => {
    const formState_0 = {
      ...getFields()
    };
    const pasteArgs = {
      onPaste: dataFromClipboard => {
        const newState = mergeFormStateFromClipboard({
          dataFromClipboard,
          formState: formState_0,
          path,
          rowIndex: rowIndex_3
        });
        replaceState(newState);
        setModified(true);
      },
      path,
      schemaFields: fields,
      t
    };
    const clipboardResult_0 = clipboardPaste(pasteArgs);
    if (typeof clipboardResult_0 === 'string') {
      toast.error(clipboardResult_0);
    }
  }, [fields, getFields, path, replaceState, setModified, t]);
  const pasteField = useCallback(dataFromClipboard_0 => {
    const formState_1 = {
      ...getFields()
    };
    const newState_0 = mergeFormStateFromClipboard({
      dataFromClipboard: dataFromClipboard_0,
      formState: formState_1,
      path
    });
    replaceState(newState_0);
    setModified(true);
  }, [getFields, path, replaceState, setModified]);
  const getDataToCopy = useCallback(() => reduceFormStateByPath({
    formState: {
      ...getFields()
    },
    path
  }), [getFields, path]);
  const hasMaxRows = maxRows && rows.length >= maxRows;
  const fieldErrorCount = errorPaths.length;
  const fieldHasErrors = submitted && errorPaths.length > 0;
  const showRequired = (readOnly || disabled) && rows.length === 0;
  const showMinRows = rows.length && rows.length < minRows || required && rows.length === 0;
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`].filter(Boolean).join(' '),
    id: `field-${path.replace(/\./g, '__')}`,
    style: styles,
    children: [showError && /*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Error,
      Fallback: /*#__PURE__*/_jsx(FieldError, {
        path: path,
        showError: showError
      })
    }), /*#__PURE__*/_jsxs("header", {
      className: `${baseClass}__header`,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__header-wrap`,
        children: [/*#__PURE__*/_jsxs("div", {
          className: `${baseClass}__header-content`,
          children: [/*#__PURE__*/_jsx("h3", {
            className: `${baseClass}__title`,
            children: /*#__PURE__*/_jsx(RenderCustomComponent, {
              CustomComponent: Label,
              Fallback: /*#__PURE__*/_jsx(FieldLabel, {
                as: "span",
                label: label,
                localized: localized,
                path: path,
                required: required
              })
            })
          }), fieldHasErrors && fieldErrorCount > 0 && /*#__PURE__*/_jsx(ErrorPill, {
            count: fieldErrorCount,
            i18n: i18n,
            withMessage: true
          })]
        }), /*#__PURE__*/_jsxs("ul", {
          className: `${baseClass}__header-actions`,
          children: [rows?.length > 0 && /*#__PURE__*/_jsxs(Fragment, {
            children: [/*#__PURE__*/_jsx("li", {
              children: /*#__PURE__*/_jsx("button", {
                className: `${baseClass}__header-action`,
                onClick: () => toggleCollapseAll(true),
                type: "button",
                children: t('fields:collapseAll')
              })
            }), /*#__PURE__*/_jsx("li", {
              children: /*#__PURE__*/_jsx("button", {
                className: `${baseClass}__header-action`,
                onClick: () => toggleCollapseAll(false),
                type: "button",
                children: t('fields:showAll')
              })
            })]
          }), /*#__PURE__*/_jsx("li", {
            children: /*#__PURE__*/_jsx(ClipboardAction, {
              allowCopy: rows?.length > 0,
              allowPaste: !readOnly,
              className: `${baseClass}__header-action`,
              disabled: disabled,
              fields: fields,
              getDataToCopy: getDataToCopy,
              onPaste: pasteField,
              path: path,
              type: type
            })
          })]
        })]
      }), /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Description,
        Fallback: /*#__PURE__*/_jsx(FieldDescription, {
          description: description,
          path: path
        })
      })]
    }), /*#__PURE__*/_jsx(NullifyLocaleField, {
      fieldValue: value_0,
      localized: localized,
      path: path,
      readOnly: readOnly
    }), BeforeInput, (rows?.length > 0 || !valid && (showRequired || showMinRows)) && /*#__PURE__*/_jsxs(DraggableSortable, {
      className: `${baseClass}__draggable-rows`,
      ids: rows.map(row => row.id),
      onDragEnd: ({
        moveFromIndex: moveFromIndex_0,
        moveToIndex: moveToIndex_0
      }) => moveRow(moveFromIndex_0, moveToIndex_0),
      children: [rows.map((rowData, i) => {
        const {
          id: rowID_0,
          isLoading
        } = rowData;
        const rowPath = `${path}.${i}`;
        const rowErrorCount = errorPaths?.filter(errorPath => errorPath.startsWith(rowPath + '.')).length;
        return /*#__PURE__*/_jsx(DraggableSortableItem, {
          disabled: readOnly || disabled || !isSortable,
          id: rowID_0,
          children: draggableSortableItemProps => /*#__PURE__*/_jsx(ArrayRow, {
            ...draggableSortableItemProps,
            addRow: addRow,
            copyRow: copyRow,
            CustomRowLabel: rows?.[i]?.customComponents?.RowLabel,
            duplicateRow: duplicateRow,
            errorCount: rowErrorCount,
            fields: fields,
            forceRender: forceRender,
            hasMaxRows: hasMaxRows,
            isLoading: isLoading,
            isSortable: isSortable,
            labels: labels,
            moveRow: moveRow,
            parentPath: path,
            pasteRow: pasteRow,
            path: rowPath,
            permissions: permissions,
            readOnly: readOnly || disabled,
            removeRow: removeRow,
            row: rowData,
            rowCount: rows?.length,
            rowIndex: i,
            schemaPath: schemaPath,
            scrollIdPrefix: scrollIdPrefix,
            setCollapse: setCollapse
          })
        }, rowID_0);
      }), !valid && /*#__PURE__*/_jsxs(React.Fragment, {
        children: [showRequired && /*#__PURE__*/_jsx(Banner, {
          children: t('validation:fieldHasNo', {
            label: getTranslation(labels.plural, i18n)
          })
        }), showMinRows && /*#__PURE__*/_jsx(Banner, {
          type: "error",
          children: t('validation:requiresAtLeast', {
            count: minRows,
            label: getTranslation(minRows > 1 ? labels.plural : labels.singular, i18n) || t(minRows > 1 ? 'general:rows' : 'general:row')
          })
        })]
      })]
    }), !hasMaxRows && !readOnly && /*#__PURE__*/_jsx(Button, {
      buttonStyle: "icon-label",
      className: `${baseClass}__add-row`,
      disabled: disabled,
      icon: "plus",
      iconPosition: "left",
      iconStyle: "with-border",
      onClick: () => {
        void addRow(value_0 || 0);
      },
      children: t('fields:addLabel', {
        label: getTranslation(labels.singular, i18n)
      })
    }), AfterInput]
  });
};
export const ArrayField = withCondition(ArrayFieldComponent);
//# sourceMappingURL=index.js.map