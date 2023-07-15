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
import { Props } from './types';
import { scrollToID } from '../../../../utilities/scrollToID';
import { getTranslation } from '../../../../../utilities/getTranslation';
import { useConfig } from '../../../utilities/Config';
import { NullifyLocaleField } from '../../NullifyField';
import DraggableSortable from '../../../elements/DraggableSortable';
import DraggableSortableItem from '../../../elements/DraggableSortable/DraggableSortableItem';
import { ArrayRow } from './ArrayRow';
import { ErrorPill } from '../../../elements/ErrorPill';

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
  const fieldErrorCount = rows.reduce((total, row) => total + (row?.childErrorPaths?.size || 0), 0) + (valid ? 0 : 1);
  const fieldHasErrors = submitted && fieldErrorCount > 0;

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
          <div className={`${baseClass}__header-content`}>
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
