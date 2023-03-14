import React, { Fragment, useCallback, useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../utilities/Auth';
import { usePreferences } from '../../../utilities/Preferences';
import { useLocale } from '../../../utilities/Locale';
import withCondition from '../../withCondition';
import reducer, { Row } from '../rowReducer';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { useForm } from '../../Form/context';
import buildStateFromSchema from '../../Form/buildStateFromSchema';
import Error from '../../Error';
import useField from '../../useField';
import { BlocksDrawer } from './BlocksDrawer';
import { blocks as blocksValidator } from '../../../../../fields/validations';
import Banner from '../../../elements/Banner';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';
import { useOperation } from '../../../utilities/OperationProvider';
import { Collapsible } from '../../../elements/Collapsible';
import RenderFields from '../../RenderFields';
import SectionTitle from './SectionTitle';
import Pill from '../../../elements/Pill';
import { scrollToID } from '../../../../utilities/scrollToID';
import HiddenInput from '../HiddenInput';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { NullifyLocaleField } from '../../NullifyField';
import { useConfig } from '../../../utilities/Config';
import { createNestedFieldPath } from '../../Form/createNestedFieldPath';
import DraggableSortable from '../../../elements/DraggableSortable';
import DraggableSortableItem from '../../../elements/DraggableSortable/DraggableSortableItem';
import { useDrawerSlug } from '../../../elements/Drawer/useDrawerSlug';
import Button from '../../../elements/Button';
import { RowActions } from './RowActions';
import { DrawerToggler } from '../../../elements/Drawer';

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
      initCollapsed,
      className,
    },
  } = props;

  const path = pathFromProps || name;

  const { preferencesKey } = useDocumentInfo();
  const { getPreference } = usePreferences();
  const { setPreference } = usePreferences();
  const [rows, dispatchRows] = useReducer(reducer, undefined);
  const formContext = useForm();
  const { user } = useAuth();
  const { id } = useDocumentInfo();
  const locale = useLocale();
  const operation = useOperation();
  const { dispatchFields, setModified } = formContext;
  const { localization } = useConfig();
  const drawerSlug = useDrawerSlug('blocks-drawer');

  const labels = {
    singular: t('block'),
    plural: t('blocks'),
    ...labelsFromProps,
  };

  const checkSkipValidation = useCallback((value) => {
    const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
    const isEditingDefaultLocale = locale === defaultLocale;
    const fallbackEnabled = (localization && localization.fallback);

    if (value === null && !isEditingDefaultLocale && fallbackEnabled) return true;
    return false;
  }, [locale, localization]);

  const memoizedValidate = useCallback((value, options) => {
    if (checkSkipValidation(value)) return true;
    return validate(value, { ...options, minRows, maxRows, required });
  }, [maxRows, minRows, required, validate, checkSkipValidation]);

  const {
    showError,
    errorMessage,
    value,
  } = useField<number>({
    path,
    validate: memoizedValidate,
    condition,
    disableFormData: rows?.length > 0,
  });

  const addRow = useCallback(async (rowIndex: number, blockType: string) => {
    const block = blocks.find((potentialBlock) => potentialBlock.slug === blockType);
    const subFieldState = await buildStateFromSchema({ fieldSchema: block.fields, operation, id, user, locale, t });
    dispatchFields({ type: 'ADD_ROW', rowIndex, subFieldState, path, blockType });
    dispatchRows({ type: 'ADD', rowIndex, blockType });
    setModified(true);

    setTimeout(() => {
      scrollToID(`${path}-row-${rowIndex + 1}`);
    }, 0);
  }, [blocks, operation, id, user, locale, t, dispatchFields, path, setModified]);

  const duplicateRow = useCallback(async (rowIndex: number, blockType: string) => {
    dispatchFields({ type: 'DUPLICATE_ROW', rowIndex, path });
    dispatchRows({ type: 'ADD', rowIndex, blockType });
    setModified(true);

    setTimeout(() => {
      scrollToID(`${path}-row-${rowIndex + 1}`);
    }, 0);
  }, [dispatchRows, dispatchFields, path, setModified]);

  const removeRow = useCallback((rowIndex: number) => {
    dispatchRows({ type: 'REMOVE', rowIndex });
    dispatchFields({ type: 'REMOVE_ROW', rowIndex, path });
    setModified(true);
  }, [path, dispatchFields, setModified]);

  const moveRow = useCallback((moveFromIndex: number, moveToIndex: number) => {
    dispatchRows({ type: 'MOVE', moveFromIndex, moveToIndex });
    dispatchFields({ type: 'MOVE_ROW', moveFromIndex, moveToIndex, path });
    setModified(true);
  }, [dispatchRows, dispatchFields, path, setModified]);

  const setCollapse = useCallback(async (rowID: string, collapsed: boolean) => {
    dispatchRows({ type: 'SET_COLLAPSE', id: rowID, collapsed });

    if (preferencesKey) {
      const preferencesToSet = await getPreference(preferencesKey) || { fields: {} };
      let newCollapsedState: string[] = preferencesToSet?.fields?.[path]?.collapsed;

      if (initCollapsed && typeof newCollapsedState === 'undefined') {
        newCollapsedState = rows.map((row) => row.id);
      } else if (typeof newCollapsedState === 'undefined') {
        newCollapsedState = [];
      }

      if (!collapsed) {
        newCollapsedState = newCollapsedState.filter((existingID) => existingID !== rowID);
      } else {
        newCollapsedState.push(rowID);
      }

      setPreference(preferencesKey, {
        ...preferencesToSet,
        fields: {
          ...preferencesToSet?.fields || {},
          [path]: {
            ...preferencesToSet?.fields?.[path],
            collapsed: newCollapsedState,
          },
        },
      });
    }
  }, [preferencesKey, getPreference, path, setPreference, initCollapsed, rows]);

  const toggleCollapseAll = useCallback(async (collapse: boolean) => {
    dispatchRows({ type: 'SET_ALL_COLLAPSED', collapse });

    if (preferencesKey) {
      const preferencesToSet = await getPreference(preferencesKey) || { fields: {} };

      setPreference(preferencesKey, {
        ...preferencesToSet,
        fields: {
          ...preferencesToSet?.fields || {},
          [path]: {
            ...preferencesToSet?.fields?.[path],
            collapsed: collapse ? rows.map(({ id: rowID }) => rowID) : [],
          },
        },
      });
    }
  }, [getPreference, path, preferencesKey, rows, setPreference]);

  // Set row count on mount and when form context is reset
  useEffect(() => {
    const initializeRowState = async () => {
      const data = formContext.getDataByPath<Row[]>(path);

      const preferences = (await getPreference(preferencesKey)) || { fields: {} };
      dispatchRows({ type: 'SET_ALL', data: data || [], collapsedState: preferences?.fields?.[path]?.collapsed, initCollapsed });
    };

    initializeRowState();
  }, [formContext, path, getPreference, preferencesKey, initCollapsed]);

  const hasMaxRows = maxRows && rows?.length >= maxRows;

  const classes = [
    'field-type',
    baseClass,
    className,
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
          <h3>{getTranslation(label || name, i18n)}</h3>
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

          const rowNumber = i + 1;

          if (blockToRender) {
            return (
              <DraggableSortableItem
                key={row.id}
                id={row.id}
                disabled={readOnly}
              >
                {({ setNodeRef, transform, attributes, listeners }) => (
                  <div
                    id={`${path}-row-${i}`}
                    ref={setNodeRef}
                    style={{
                      transform,
                    }}
                  >
                    <Collapsible
                      collapsed={row.collapsed}
                      onToggle={(collapsed) => setCollapse(row.id, collapsed)}
                      className={`${baseClass}__row`}
                      key={row.id}
                      dragHandleProps={{
                        id: row.id,
                        attributes,
                        listeners,
                      }}
                      header={(
                        <div className={`${baseClass}__block-header`}>
                          <span className={`${baseClass}__block-number`}>
                            {rowNumber >= 10 ? rowNumber : `0${rowNumber}`}
                          </span>
                          <Pill
                            pillStyle="white"
                            className={`${baseClass}__block-pill ${baseClass}__block-pill-${blockType}`}
                          >
                            {getTranslation(blockToRender.labels.singular, i18n)}
                          </Pill>
                          <SectionTitle
                            path={`${path}.${i}.blockName`}
                            readOnly={readOnly}
                          />
                        </div>
                      )}
                      actions={!readOnly ? (
                        <RowActions
                          addRow={addRow}
                          removeRow={removeRow}
                          duplicateRow={duplicateRow}
                          moveRow={moveRow}
                          rows={rows}
                          blockType={blockType}
                          blocks={blocks}
                          labels={labels}
                          rowIndex={i}
                        />
                      ) : undefined}
                    >
                      <HiddenInput
                        name={`${path}.${i}.id`}
                        value={row.id}
                      />
                      <RenderFields
                        className={`${baseClass}__fields`}
                        readOnly={readOnly}
                        fieldTypes={fieldTypes}
                        permissions={permissions?.fields}
                        fieldSchema={blockToRender.fields.map((field) => ({
                          ...field,
                          path: createNestedFieldPath(`${path}.${i}`, field),
                        }))}
                        indexPath={indexPath}
                      />

                    </Collapsible>
                  </div>
                )}
              </DraggableSortableItem>
            );
          }

          return null;
        })}
        {!checkSkipValidation(value) && (
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
              iconPosition="left"
              iconStyle="with-border"
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
