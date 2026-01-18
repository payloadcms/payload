'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React, { Fragment, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Banner } from '../../elements/Banner/index.js';
import { Button } from '../../elements/Button/index.js';
import { clipboardCopy, clipboardPaste } from '../../elements/ClipboardAction/clipboardUtilities.js';
import { ClipboardAction } from '../../elements/ClipboardAction/index.js';
import { mergeFormStateFromClipboard, reduceFormStateByPath } from '../../elements/ClipboardAction/mergeFormStateFromClipboard.js';
import { DraggableSortableItem } from '../../elements/DraggableSortable/DraggableSortableItem/index.js';
import { DraggableSortable } from '../../elements/DraggableSortable/index.js';
import { DrawerToggler } from '../../elements/Drawer/index.js';
import { useDrawerSlug } from '../../elements/Drawer/useDrawerSlug.js';
import { ErrorPill } from '../../elements/ErrorPill/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
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
import './index.scss';
import { FieldDescription } from '../FieldDescription/index.js';
import { FieldError } from '../FieldError/index.js';
import { FieldLabel } from '../FieldLabel/index.js';
import { mergeFieldStyles } from '../mergeFieldStyles.js';
import { fieldBaseClass } from '../shared/index.js';
import { BlockRow } from './BlockRow.js';
import { BlocksDrawer } from './BlocksDrawer/index.js';
const baseClass = 'blocks-field';
const BlocksFieldComponent = props => {
  const {
    i18n,
    t
  } = useTranslation();
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
      blockReferences,
      blocks,
      label,
      labels: labelsFromProps,
      localized,
      maxRows,
      minRows: minRowsProp,
      required
    },
    path: pathFromProps,
    permissions,
    readOnly,
    schemaPath: schemaPathFromProps,
    validate
  } = props;
  const schemaPath = schemaPathFromProps ?? name;
  const minRows = minRowsProp ?? required ? 1 : 0;
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
  const {
    code: locale
  } = useLocale();
  const {
    config: {
      localization
    },
    config
  } = useConfig();
  const drawerSlug = useDrawerSlug('blocks-drawer');
  const submitted = useFormSubmitted();
  const labels = {
    plural: t('fields:blocks'),
    singular: t('fields:block'),
    ...labelsFromProps
  };
  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale;
      return locale === defaultLocale;
    }
    return true;
  })();
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
    blocksFilterOptions,
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
  const {
    clientBlocks,
    clientBlocksAfterFilter: clientBlocksAfterFilter_0
  } = useMemo(() => {
    let resolvedBlocks = [];
    if (!blockReferences) {
      resolvedBlocks = blocks;
    } else {
      for (const blockReference of blockReferences) {
        const block = typeof blockReference === 'string' ? config.blocksMap[blockReference] : blockReference;
        if (block) {
          resolvedBlocks.push(block);
        }
      }
    }
    if (Array.isArray(blocksFilterOptions)) {
      const clientBlocksAfterFilter = resolvedBlocks.filter(block_0 => {
        const blockSlug = typeof block_0 === 'string' ? block_0 : block_0.slug;
        return blocksFilterOptions.includes(blockSlug);
      });
      return {
        clientBlocks: resolvedBlocks,
        clientBlocksAfterFilter
      };
    }
    return {
      clientBlocks: resolvedBlocks,
      clientBlocksAfterFilter: resolvedBlocks
    };
  }, [blockReferences, blocks, blocksFilterOptions, config.blocksMap]);
  const addRow = useCallback((rowIndex, blockType) => {
    addFieldRow({
      blockType,
      path,
      rowIndex,
      schemaPath
    });
    setTimeout(() => {
      scrollToID(`${path}-row-${rowIndex + 1}`);
    }, 0);
  }, [addFieldRow, path, schemaPath]);
  const duplicateRow = useCallback(rowIndex_0 => {
    dispatchFields({
      type: 'DUPLICATE_ROW',
      path,
      rowIndex: rowIndex_0
    });
    setModified(true);
    setTimeout(() => {
      scrollToID(`${path}-row-${rowIndex_0 + 1}`);
    }, 0);
  }, [dispatchFields, path, setModified]);
  const removeRow = useCallback(rowIndex_1 => {
    removeFieldRow({
      path,
      rowIndex: rowIndex_1
    });
  }, [path, removeFieldRow]);
  const moveRow = useCallback((moveFromIndex, moveToIndex) => {
    moveFieldRow({
      moveFromIndex,
      moveToIndex,
      path
    });
  }, [moveFieldRow, path]);
  const toggleCollapseAll = useCallback(collapsed => {
    const {
      collapsedIDs,
      updatedRows
    } = toggleAllRows({
      collapsed,
      rows
    });
    dispatchFields({
      type: 'SET_ALL_ROWS_COLLAPSED',
      path,
      updatedRows
    });
    setDocFieldPreferences(path, {
      collapsed: collapsedIDs
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
    const clipboardResult = clipboardCopy({
      type,
      blocks: clientBlocks,
      getDataToCopy: () => reduceFormStateByPath({
        formState: {
          ...getFields()
        },
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
  }, [clientBlocks, path, t, type, getFields]);
  const pasteRow = useCallback(rowIndex_3 => {
    const pasteArgs = {
      onPaste: dataFromClipboard => {
        const formState = {
          ...getFields()
        };
        const newState = mergeFormStateFromClipboard({
          dataFromClipboard,
          formState,
          path,
          rowIndex: rowIndex_3
        });
        replaceState(newState);
        setModified(true);
      },
      path,
      schemaBlocks: clientBlocks,
      t
    };
    const clipboardResult_0 = clipboardPaste(pasteArgs);
    if (typeof clipboardResult_0 === 'string') {
      toast.error(clipboardResult_0);
    }
  }, [clientBlocks, getFields, path, replaceState, setModified, t]);
  const pasteBlocks = useCallback(dataFromClipboard_0 => {
    const formState_0 = {
      ...getFields()
    };
    const newState_0 = mergeFormStateFromClipboard({
      dataFromClipboard: dataFromClipboard_0,
      formState: formState_0,
      path
    });
    replaceState(newState_0);
    setModified(true);
  }, [getFields, path, replaceState, setModified]);
  const hasMaxRows = maxRows && rows.length >= maxRows;
  const fieldErrorCount = errorPaths.length;
  const fieldHasErrors = submitted && fieldErrorCount + (valid ? 0 : 1) > 0;
  const showMinRows = rows.length < minRows || required && rows.length === 0;
  const showRequired = readOnly && rows.length === 0;
  const styles = useMemo(() => mergeFieldStyles(field), [field]);
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`].filter(Boolean).join(' '),
    id: `field-${path?.replace(/\./g, '__')}`,
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
          className: `${baseClass}__heading-with-error`,
          children: [/*#__PURE__*/_jsx("h3", {
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
          children: [rows.length > 0 && /*#__PURE__*/_jsxs(Fragment, {
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
              blocks: clientBlocks,
              className: `${baseClass}__header-action`,
              disabled: disabled,
              getDataToCopy: () => reduceFormStateByPath({
                formState: {
                  ...getFields()
                },
                path
              }),
              onPaste: pasteBlocks,
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
    }), BeforeInput, /*#__PURE__*/_jsx(NullifyLocaleField, {
      fieldValue: value_0,
      localized: localized,
      path: path,
      readOnly: readOnly
    }), (rows.length > 0 || !valid && (showRequired || showMinRows)) && /*#__PURE__*/_jsxs(DraggableSortable, {
      className: `${baseClass}__rows`,
      ids: rows.map(row => row.id),
      onDragEnd: ({
        moveFromIndex: moveFromIndex_0,
        moveToIndex: moveToIndex_0
      }) => moveRow(moveFromIndex_0, moveToIndex_0),
      children: [rows.map((row_0, i) => {
        const {
          blockType: blockType_0,
          isLoading
        } = row_0;
        const blockConfig = config.blocksMap[blockType_0] ?? clientBlocks.find(block_1 => block_1.slug === blockType_0);
        if (blockConfig) {
          const rowPath = `${path}.${i}`;
          const rowErrorCount = errorPaths.filter(errorPath => errorPath.startsWith(rowPath + '.')).length;
          return /*#__PURE__*/_jsx(DraggableSortableItem, {
            disabled: readOnly || disabled || !isSortable,
            id: row_0.id,
            children: draggableSortableItemProps => /*#__PURE__*/_jsx(BlockRow, {
              ...draggableSortableItemProps,
              addRow: addRow,
              block: blockConfig,
              // Pass all blocks, not just clientBlocksAfterFilter, as existing blocks should still be displayed even if they don't match the new filter
              blocks: clientBlocks,
              copyRow: copyRow,
              duplicateRow: duplicateRow,
              errorCount: rowErrorCount,
              fields: blockConfig.fields,
              hasMaxRows: hasMaxRows,
              isLoading: isLoading,
              isSortable: isSortable,
              Label: rows?.[i]?.customComponents?.RowLabel,
              labels: labels,
              moveRow: moveRow,
              parentPath: path,
              pasteRow: pasteRow,
              path: rowPath,
              permissions: permissions,
              readOnly: readOnly || disabled,
              removeRow: removeRow,
              row: row_0,
              rowCount: rows.length,
              rowIndex: i,
              schemaPath: schemaPath + blockConfig.slug,
              setCollapse: setCollapse
            })
          }, row_0.id);
        }
        return null;
      }), !editingDefaultLocale && /*#__PURE__*/_jsxs(React.Fragment, {
        children: [showMinRows && /*#__PURE__*/_jsx(Banner, {
          type: "error",
          children: t('validation:requiresAtLeast', {
            count: minRows,
            label: getTranslation(minRows > 1 ? labels.plural : labels.singular, i18n) || t(minRows > 1 ? 'general:row' : 'general:rows')
          })
        }), showRequired && /*#__PURE__*/_jsx(Banner, {
          children: t('validation:fieldHasNo', {
            label: getTranslation(labels.plural, i18n)
          })
        })]
      })]
    }), !hasMaxRows && /*#__PURE__*/_jsxs(Fragment, {
      children: [/*#__PURE__*/_jsx(DrawerToggler, {
        className: `${baseClass}__drawer-toggler`,
        disabled: readOnly || disabled,
        slug: drawerSlug,
        children: /*#__PURE__*/_jsx(Button, {
          buttonStyle: "icon-label",
          disabled: readOnly || disabled,
          el: "span",
          icon: "plus",
          iconPosition: "left",
          iconStyle: "with-border",
          children: t('fields:addLabel', {
            label: getTranslation(labels.singular, i18n)
          })
        })
      }), /*#__PURE__*/_jsx(BlocksDrawer, {
        addRow: addRow,
        addRowIndex: rows?.length || 0,
        // Only allow choosing filtered blocks
        blocks: clientBlocksAfterFilter_0,
        drawerSlug: drawerSlug,
        labels: labels
      })]
    }), AfterInput]
  });
};
export const BlocksField = withCondition(BlocksFieldComponent);
//# sourceMappingURL=index.js.map