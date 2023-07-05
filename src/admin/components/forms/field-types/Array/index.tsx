import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../utilities/Auth';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import { useForm } from '../../Form/context';
import buildStateFromSchema from '../../Form/buildStateFromSchema';
import useField from '../../useField';
import { useLocale } from '../../../utilities/Locale';
import Error from '../../Error';
import { array } from '../../../../../fields/validations';
import Banner from '../../../elements/Banner';
import FieldDescription from '../../FieldDescription';
import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { useOperation } from '../../../utilities/OperationProvider';
import { Collapsible } from '../../../elements/Collapsible';
import RenderFields from '../../RenderFields';
import { Props } from './types';
import { ArrayAction } from '../../../elements/ArrayAction';
import { scrollToID } from '../../../../utilities/scrollToID';
import HiddenInput from '../HiddenInput';
import { RowLabel } from '../../RowLabel';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { createNestedFieldPath } from '../../Form/createNestedFieldPath';
import { useConfig } from '../../../utilities/Config';
import { NullifyLocaleField } from '../../NullifyField';
import DraggableSortable from '../../../elements/DraggableSortable';
import DraggableSortableItem from '../../../elements/DraggableSortable/DraggableSortableItem';

import './index.scss';

const baseClass = 'array-field';

const ArrayFieldType: React.FC<Props> = (props) => {
  const {
    name,
    path: pathFromProps,
    fields,
    fieldTypes,
    validate = array,
    required,
    maxRows,
    minRows,
    permissions,
    indexPath,
    localized,
    admin: {
      readOnly,
      description,
      condition,
      className,
      components,
    },
  } = props;

  const path = pathFromProps || name;

  // eslint-disable-next-line react/destructuring-assignment
  const label = props?.label ?? props?.labels?.singular;

  const CustomRowLabel = components?.RowLabel || undefined;

  const { setDocFieldPreferences, id, getDocPreferences } = useDocumentInfo();
  const formContext = useForm();
  const { user } = useAuth();
  const locale = useLocale();
  const operation = useOperation();
  const { t, i18n } = useTranslation('fields');
  const { localization } = useConfig();

  const checkSkipValidation = useCallback((value) => {
    const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
    const isEditingDefaultLocale = locale === defaultLocale;
    const fallbackEnabled = (localization && localization.fallback);

    if (value === null && !isEditingDefaultLocale && fallbackEnabled) return true;
    return false;
  }, [locale, localization]);

  // Handle labeling for Arrays, Global Arrays, and Blocks
  const getLabels = (p: Props) => {
    if (p?.labels) return p.labels;
    if (p?.label) return { singular: p.label, plural: undefined };
    return { singular: t('row'), plural: t('rows') };
  };

  const labels = getLabels(props);

  const { dispatchFields, setModified } = formContext;

  const memoizedValidate = useCallback((value, options) => {
    if (checkSkipValidation(value)) return true;
    return validate(value, { ...options, minRows, maxRows, required });
  }, [maxRows, minRows, required, validate, checkSkipValidation]);

  const {
    showError,
    errorMessage,
    value,
    rows,
  } = useField<number>({
    path,
    validate: memoizedValidate,
    condition,
    hasRows: true,
  });

  const addRow = useCallback(async (rowIndex: number) => {
    const preferences = await getDocPreferences();
    const subFieldState = await buildStateFromSchema({ fieldSchema: fields, preferences, operation, id, user, locale, t });
    dispatchFields({ type: 'ADD_ROW', rowIndex, subFieldState, path });
    setModified(true);

    setTimeout(() => {
      scrollToID(`${path}-row-${rowIndex + 1}`);
    }, 0);
  }, [dispatchFields, fields, id, locale, operation, path, setModified, t, user, getDocPreferences]);

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

  const setCollapse = useCallback(async (rowID: string, collapsed: boolean) => {
    dispatchFields({ type: 'SET_ROW_COLLAPSED', path, collapsed, rowID, setDocFieldPreferences });
  }, [dispatchFields, path, setDocFieldPreferences]);

  const toggleCollapseAll = useCallback(async (collapsed: boolean) => {
    dispatchFields({ type: 'SET_ALL_ROWS_COLLAPSED', path, collapsed, setDocFieldPreferences });
  }, [dispatchFields, path, setDocFieldPreferences]);

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
          className={`field-description-${path.replace(/\./gi, '__')}`}
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
          const rowNumber = i + 1;
          const fallbackLabel = `${getTranslation(labels.singular, i18n)} ${String(rowNumber).padStart(2, '0')}`;

          return (
            <DraggableSortableItem
              key={row.id}
              id={row.id}
              disabled={readOnly}
            >
              {({ setNodeRef, transform, attributes, listeners }) => (
                <div
                  id={`${path}-row-${i}`}
                  key={`${path}-row-${i}`}
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
                      <RowLabel
                        path={`${path}.${i}`}
                        label={CustomRowLabel || fallbackLabel}
                        rowNumber={rowNumber}
                      />
                    )}
                    actions={!readOnly ? (
                      <ArrayAction
                        rowCount={rows.length}
                        duplicateRow={duplicateRow}
                        addRow={addRow}
                        moveRow={moveRow}
                        removeRow={removeRow}
                        index={i}
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
                      indexPath={indexPath}
                      fieldSchema={fields.map((field) => ({
                        ...field,
                        path: createNestedFieldPath(`${path}.${i}`, field),
                      }))}
                    />

                  </Collapsible>
                </div>
              )}
            </DraggableSortableItem>
          );
        })}
        {!checkSkipValidation(value) && (
          <React.Fragment>
            {(rows.length < minRows || (required && rows.length === 0)) && (
              <Banner type="error">
                {t('validation:requiresAtLeast', {
                  count: minRows,
                  label: getTranslation(minRows ? labels.plural : labels.singular, i18n) || t(minRows > 1 ? 'general:row' : 'general:rows'),
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
        <div className={`${baseClass}__add-button-wrap`}>
          <Button
            onClick={() => addRow(value as number)}
            buttonStyle="icon-label"
            icon="plus"
            iconStyle="with-border"
            iconPosition="left"
          >
            {t('addLabel', { label: getTranslation(labels.singular, i18n) })}
          </Button>
        </div>
      )}

    </div>
  );
};

export default withCondition(ArrayFieldType);
