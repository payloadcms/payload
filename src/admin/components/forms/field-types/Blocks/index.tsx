import React, { Fragment, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../utilities/Auth';
import { useLocale } from '../../../utilities/Locale';
import withCondition from '../../withCondition';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { useForm, useFormSubmitted } from '../../Form/context';
import buildStateFromSchema from '../../Form/buildStateFromSchema';
import Error from '../../Error';
import useField from '../../useField';
import { BlocksDrawer } from './BlocksDrawer';
import { blocks as blocksValidator } from '../../../../../fields/validations';
import Banner from '../../../elements/Banner';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';
import { useOperation } from '../../../utilities/OperationProvider';
import { scrollToID } from '../../../../utilities/scrollToID';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { NullifyLocaleField } from '../../NullifyField';
import { useConfig } from '../../../utilities/Config';
import DraggableSortable from '../../../elements/DraggableSortable';
import DraggableSortableItem from '../../../elements/DraggableSortable/DraggableSortableItem';
import { useDrawerSlug } from '../../../elements/Drawer/useDrawerSlug';
import Button from '../../../elements/Button';
import { DrawerToggler } from '../../../elements/Drawer';
import { BlockRow } from './BlockRow';
import { ErrorPill } from '../../../elements/ErrorPill';

import './index.scss';

const baseClass = 'blocks-field';

const BlocksField: React.FC<Props> = (props) => {
  const { t, i18n } = useTranslation('fields');

  const {
    label,
    name,
    path: pathFromProps,
    blocks,
    labels: labelsFromProps,
    fieldTypes,
    maxRows,
    minRows,
    required,
    validate = blocksValidator,
    permissions,
    indexPath,
    localized,
    admin: {
      readOnly,
      description,
      condition,
      className,
    },
  } = props;

  const path = pathFromProps || name;

  const { id, setDocFieldPreferences, getDocPreferences } = useDocumentInfo();
  const { dispatchFields, setModified } = useForm();
  const { user } = useAuth();
  const locale = useLocale();
  const operation = useOperation();
  const { localization } = useConfig();
  const drawerSlug = useDrawerSlug('blocks-drawer');
  const submitted = useFormSubmitted();

  const labels = {
    singular: t('block'),
    plural: t('blocks'),
    ...labelsFromProps,
  };

  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale || 'en';
      return locale === defaultLocale;
    }

    return true;
  })();
  const memoizedValidate = useCallback((value, options) => {
    // alternative locales can be null
    if (!editingDefaultLocale && value === null) {
      return true;
    }
    return validate(value, { ...options, minRows, maxRows, required });
  }, [maxRows, minRows, required, validate, editingDefaultLocale]);


  const {
    showError,
    errorMessage,
    value,
    rows,
    valid,
  } = useField<number>({
    path,
    validate: memoizedValidate,
    condition,
    hasRows: true,
  });

  const addRow = useCallback(async (rowIndex: number, blockType: string) => {
    const block = blocks.find((potentialBlock) => potentialBlock.slug === blockType);
    const preferences = await getDocPreferences();
    const subFieldState = await buildStateFromSchema({ fieldSchema: block.fields, preferences, operation, id, user, locale, t });
    dispatchFields({ type: 'ADD_ROW', rowIndex, subFieldState, path, blockType });
    setModified(true);

    setTimeout(() => {
      scrollToID(`${path}-row-${rowIndex + 1}`);
    }, 0);
  }, [blocks, dispatchFields, id, locale, operation, path, getDocPreferences, setModified, t, user]);

  const duplicateRow = useCallback(async (rowIndex: number) => {
    dispatchFields({ type: 'DUPLICATE_ROW', rowIndex, path });
    setModified(true);

    setTimeout(() => {
      scrollToID(`${path}-row-${rowIndex + 1}`);
    }, 0);
  }, [dispatchFields, path, setModified]);

  const removeRow = useCallback((rowIndex: number) => {
    dispatchFields({ type: 'REMOVE_ROW', rowIndex, path });
    setModified(true);
  }, [dispatchFields, path, setModified]);

  const moveRow = useCallback((moveFromIndex: number, moveToIndex: number) => {
    dispatchFields({ type: 'MOVE_ROW', moveFromIndex, moveToIndex, path });
    setModified(true);
  }, [dispatchFields, path, setModified]);

  const toggleCollapseAll = useCallback(async (collapsed: boolean) => {
    dispatchFields({ type: 'SET_ALL_ROWS_COLLAPSED', path, collapsed, setDocFieldPreferences });
  }, [dispatchFields, path, setDocFieldPreferences]);

  const setCollapse = useCallback(async (rowID: string, collapsed: boolean) => {
    dispatchFields({ type: 'SET_ROW_COLLAPSED', path, collapsed, rowID, setDocFieldPreferences });
  }, [dispatchFields, path, setDocFieldPreferences]);

  const hasMaxRows = maxRows && rows?.length >= maxRows;

  const fieldErrorCount = rows.reduce((total, row) => total + (row?.childErrorPaths?.size || 0), 0);
  const fieldHasErrors = submitted && fieldErrorCount + (valid ? 0 : 1) > 0;

  const classes = [
    'field-type',
    baseClass,
    className,
    fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
  ].filter(Boolean).join(' ');

  if (!rows) return null;

  return (
    <div
      id={`field-${path.replace(/\./gi, '__')}`}
      className={classes}
    >
      <div className={`${baseClass}__error-wrap`}>
        <Error
          showError={showError}
          message={errorMessage}
        />
      </div>
      <header className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-wrap`}>
          <div className={`${baseClass}__heading-with-error`}>
            <h3>
              {getTranslation(label || name, i18n)}
            </h3>

            {fieldHasErrors && fieldErrorCount > 0 && (
              <ErrorPill
                count={fieldErrorCount}
                withMessage
              />
            )}
          </div>
          <ul className={`${baseClass}__header-actions`}>
            <li>
              <button
                type="button"
                onClick={() => toggleCollapseAll(true)}
                className={`${baseClass}__header-action`}
              >
                {t('collapseAll')}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => toggleCollapseAll(false)}
                className={`${baseClass}__header-action`}
              >
                {t('showAll')}
              </button>
            </li>
          </ul>
        </div>
        <FieldDescription
          value={value}
          description={description}
        />
      </header>

      <NullifyLocaleField
        localized={localized}
        path={path}
        fieldValue={value}
      />

      <DraggableSortable
        ids={rows.map((row) => row.id)}
        onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
      >
        {rows.length > 0 && rows.map((row, i) => {
          const { blockType } = row;
          const blockToRender = blocks.find((block) => block.slug === blockType);

          if (blockToRender) {
            return (
              <DraggableSortableItem
                key={row.id}
                id={row.id}
                disabled={readOnly}
              >
                {(draggableSortableItemProps) => (
                  <BlockRow
                    {...draggableSortableItemProps}
                    row={row}
                    rowIndex={i}
                    indexPath={indexPath}
                    addRow={addRow}
                    duplicateRow={duplicateRow}
                    removeRow={removeRow}
                    moveRow={moveRow}
                    setCollapse={setCollapse}
                    blockToRender={blockToRender}
                    blocks={blocks}
                    fieldTypes={fieldTypes}
                    permissions={permissions}
                    readOnly={readOnly}
                    rowCount={rows.length}
                    labels={labels}
                    path={path}
                  />
                )}
              </DraggableSortableItem>
            );
          }

          return null;
        })}
        {!editingDefaultLocale && (
          <React.Fragment>
            {(rows.length < minRows || (required && rows.length === 0)) && (
              <Banner type="error">
                {t('validation:requiresAtLeast', {
                  count: minRows,
                  label: getTranslation(minRows === 1 || typeof minRows === 'undefined' ? labels.singular : labels.plural, i18n),
                })}
              </Banner>
            )}
            {(rows.length === 0 && readOnly) && (
              <Banner>
                {t('validation:fieldHasNo', { label: getTranslation(labels.plural, i18n) })}
              </Banner>
            )}
          </React.Fragment>
        )}
      </DraggableSortable>
      {(!readOnly && !hasMaxRows) && (
        <Fragment>
          <DrawerToggler
            slug={drawerSlug}
            className={`${baseClass}__drawer-toggler`}
          >
            <Button
              el="span"
              icon="plus"
              buttonStyle="icon-label"
              iconStyle="with-border"
              iconPosition="left"
            >
              {t('addLabel', { label: getTranslation(labels.singular, i18n) })}
            </Button>
          </DrawerToggler>
          <BlocksDrawer
            drawerSlug={drawerSlug}
            blocks={blocks}
            addRow={addRow}
            addRowIndex={value}
            labels={labels}
          />
        </Fragment>
      )}
    </div>
  );
};

export default withCondition(BlocksField);
