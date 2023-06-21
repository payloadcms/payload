import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../utilities/Auth';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import { useForm, useFormSubmitted } from '../../Form/context';
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
import type { UseDraggableSortableReturn } from '../../../elements/DraggableSortable/useDraggableSortable/types';
import type { Row } from '../../Form/types';
import type { RowLabel as RowLabelType } from '../../RowLabel/types';

import './index.scss';
import Pill from '../../../elements/Pill';

const baseClass = 'array-field';

type ArrayRowProps = UseDraggableSortableReturn & Pick<Props, 'fields' | 'path' | 'indexPath' | 'fieldTypes' | 'permissions' | 'labels'> & {
  addRow: (rowIndex: number) => void
  duplicateRow: (rowIndex: number) => void
  removeRow: (rowIndex: number) => void
  moveRow: (fromIndex: number, toIndex: number) => void
  setCollapse: (rowID: string, collapsed: boolean) => void
  rowCount: number
  rowIndex: number
  row: Row
  CustomRowLabel?: RowLabelType
  readOnly?: boolean
  rowErrorCount: number
}
const ArrayRow: React.FC<ArrayRowProps> = ({
  path: parentPath,
  addRow,
  removeRow,
  moveRow,
  duplicateRow,
  setCollapse,
  transform,
  listeners,
  attributes,
  setNodeRef,
  row,
  rowIndex,
  rowCount,
  indexPath,
  readOnly,
  labels,
  fieldTypes,
  permissions,
  CustomRowLabel,
  fields,
  rowErrorCount = 0,
}) => {
  const path = `${parentPath}.${rowIndex}`;
  const { i18n } = useTranslation();

  const fallbackLabel = `${getTranslation(labels.singular, i18n)} ${String(rowIndex + 1).padStart(2, '0')}`;

  const classNames = [
    `${baseClass}__row`,
    rowErrorCount > 0 ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`,
  ].filter(Boolean).join(' ');

  return (
    <div
      key={`${path}-row-${rowIndex}`}
      id={`${path}-row-${rowIndex}`}
      ref={setNodeRef}
      style={{
        transform,
      }}
    >
      <Collapsible
        collapsed={row.collapsed}
        onToggle={(collapsed) => setCollapse(row.id, collapsed)}
        className={classNames}
        collapsibleStyle={rowErrorCount > 0 ? 'error' : 'default'}
        dragHandleProps={{
          id: row.id,
          attributes,
          listeners,
        }}
        header={(
          <React.Fragment>
            <RowLabel
              path={path}
              label={CustomRowLabel || fallbackLabel}
              rowNumber={rowIndex + 1}
            />
          </React.Fragment>
        )}
        actions={!readOnly ? (
          <ArrayAction
            addRow={addRow}
            removeRow={removeRow}
            moveRow={moveRow}
            duplicateRow={duplicateRow}
            rowCount={rowCount}
            index={rowIndex}
          />
        ) : undefined}
      >
        <HiddenInput
          name={`${path}.id`}
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
            path: createNestedFieldPath(path, field),
          }))}
        />
      </Collapsible>
    </div>
  );
};

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
  const { dispatchFields, setModified } = useForm();
  const submitted = useFormSubmitted();
  const { user } = useAuth();
  const locale = useLocale();
  const operation = useOperation();
  const { t, i18n } = useTranslation('fields');
  const { localization } = useConfig();

  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale || 'en';
      return locale === defaultLocale;
    }

    return true;
  })();

  // Handle labeling for Arrays, Global Arrays, and Blocks
  const getLabels = (p: Props) => {
    if (p?.labels) return p.labels;
    if (p?.label) return { singular: p.label, plural: undefined };
    return { singular: t('row'), plural: t('rows') };
  };

  const labels = getLabels(props);

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

  const toggleCollapseAll = useCallback(async (collapsed: boolean) => {
    dispatchFields({ type: 'SET_ALL_ROWS_COLLAPSED', path, collapsed, setDocFieldPreferences });
  }, [dispatchFields, path, setDocFieldPreferences]);

  const setCollapse = useCallback(async (rowID: string, collapsed: boolean) => {
    dispatchFields({ type: 'SET_ROW_COLLAPSED', path, collapsed, rowID, setDocFieldPreferences });
  }, [dispatchFields, path, setDocFieldPreferences]);

  const hasMaxRows = maxRows && rows?.length >= maxRows;
  const fieldErrorCount = rows.reduce((total, row) => total + (row?.childErrorPaths?.size || 0), 0);
  // TODO: change submitted var
  const fieldHasErrors = !submitted && fieldErrorCount + (valid ? 0 : 1) > 0;

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
              <Pill
                pillStyle="error"
                rounded
                className={`${baseClass}__error-pill`}
              >
                {`${fieldErrorCount} ${fieldErrorCount > 1 ? t('error:plural') : t('error:singular')}`}
              </Pill>
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
        {rows.length > 0 && rows.map((row, i) => (
          <DraggableSortableItem
            key={row.id}
            id={row.id}
            disabled={readOnly}
          >
            {(draggableSortableItemProps) => (
              <ArrayRow
                {...draggableSortableItemProps}
                row={row}
                addRow={addRow}
                duplicateRow={duplicateRow}
                removeRow={removeRow}
                setCollapse={setCollapse}
                path={path}
                fieldTypes={fieldTypes}
                fields={fields}
                moveRow={moveRow}
                readOnly={readOnly}
                rowCount={rows.length}
                permissions={permissions}
                CustomRowLabel={CustomRowLabel}
                rowIndex={i}
                indexPath={indexPath}
                labels={labels}
                rowErrorCount={row.childErrorPaths?.size || 0}
              />
            )}
          </DraggableSortableItem>
        ))}

        {!valid && (
          <React.Fragment>
            {readOnly && (rows.length === 0) && (
              <Banner>
                {t('validation:fieldHasNo', { label: getTranslation(labels.plural, i18n) })}
              </Banner>
            )}

            {(rows.length < minRows || (required && rows.length === 0)) && (
              <Banner type="error">
                {t('validation:requiresAtLeast', {
                  count: minRows,
                  label: getTranslation(minRows ? labels.plural : labels.singular, i18n) || t(minRows > 1 ? 'general:row' : 'general:rows'),
                })}
              </Banner>
            )}
          </React.Fragment>
        )}
      </DraggableSortable>

      {(!readOnly && !hasMaxRows) && (
        <div className={`${baseClass}__add-button-wrap`}>
          <Button
            icon="plus"
            buttonStyle="icon-label"
            iconStyle="with-border"
            iconPosition="left"
            onClick={() => addRow(value as number)}
          >
            {t('addLabel', { label: getTranslation(labels.singular, i18n) })}
          </Button>
        </div>
      )}
    </div>
  );
};

export default withCondition(ArrayFieldType);
