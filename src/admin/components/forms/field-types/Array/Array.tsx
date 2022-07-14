import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useAuth } from '../../../utilities/Auth';
import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import DraggableSection from '../../DraggableSection';
import reducer from '../rowReducer';
import { useForm } from '../../Form/context';
import buildStateFromSchema from '../../Form/buildStateFromSchema';
import useField from '../../useField';
import { useLocale } from '../../../utilities/Locale';
import Error from '../../Error';
import { array } from '../../../../../fields/validations';
import Banner from '../../../elements/Banner';
import FieldDescription from '../../FieldDescription';
import { Props } from './types';

import { useDocumentInfo } from '../../../utilities/DocumentInfo';
import { useOperation } from '../../../utilities/OperationProvider';

import './index.scss';

const baseClass = 'field-type array';

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
    admin: {
      readOnly,
      description,
      condition,
      className,
    },
  } = props;

  // Handle labeling for Arrays, Global Arrays, and Blocks
  const getLabels = (p: Props) => {
    if (p?.labels) return p.labels;
    if (p?.label) return { singular: p.label, plural: undefined };
    return { singular: 'Row', plural: 'Rows' };
  };

  const labels = getLabels(props);
  // eslint-disable-next-line react/destructuring-assignment
  const label = props?.label ?? props?.labels?.singular;

  const [rows, dispatchRows] = useReducer(reducer, []);
  const formContext = useForm();
  const { user } = useAuth();
  const { id } = useDocumentInfo();
  const locale = useLocale();
  const operation = useOperation();

  const { dispatchFields } = formContext;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value, options) => {
    return validate(value, { ...options, minRows, maxRows, required });
  }, [maxRows, minRows, required, validate]);

  const [disableFormData, setDisableFormData] = useState(false);

  const {
    showError,
    errorMessage,
    value,
    setValue,
  } = useField({
    path,
    validate: memoizedValidate,
    disableFormData,
    condition,
  });

  const addRow = useCallback(async (rowIndex) => {
    const subFieldState = await buildStateFromSchema({ fieldSchema: fields, operation, id, user, locale });
    dispatchFields({ type: 'ADD_ROW', rowIndex, subFieldState, path });
    dispatchRows({ type: 'ADD', rowIndex });
    setValue(value as number + 1);
  }, [dispatchRows, dispatchFields, fields, path, setValue, value, operation, id, user, locale]);

  const removeRow = useCallback((rowIndex) => {
    dispatchRows({ type: 'REMOVE', rowIndex });
    dispatchFields({ type: 'REMOVE_ROW', rowIndex, path });
    setValue(value as number - 1);
  }, [dispatchRows, dispatchFields, path, value, setValue]);

  const moveRow = useCallback((moveFromIndex, moveToIndex) => {
    dispatchRows({ type: 'MOVE', moveFromIndex, moveToIndex });
    dispatchFields({ type: 'MOVE_ROW', moveFromIndex, moveToIndex, path });
  }, [dispatchRows, dispatchFields, path]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  }, [moveRow]);

  useEffect(() => {
    const data = formContext.getDataByPath(path);
    dispatchRows({ type: 'SET_ALL', data: data || [] });
  }, [formContext, path]);

  useEffect(() => {
    setValue(rows?.length || 0, true);

    if (rows?.length === 0) {
      setDisableFormData(false);
    } else {
      setDisableFormData(true);
    }
  }, [rows, setValue]);

  const hasMaxRows = maxRows && rows.length >= maxRows;

  const classes = [
    baseClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        id={`field-${path}`}
        className={classes}
      >
        <div className={`${baseClass}__error-wrap`}>
          <Error
            showError={showError}
            message={errorMessage}
          />
        </div>
        <header className={`${baseClass}__header`}>
          <h3>{label}</h3>
          <FieldDescription
            value={value}
            description={description}
          />
        </header>
        <Droppable droppableId="array-drop">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {rows.length > 0 && rows.map((row, i) => (
                <DraggableSection
                  readOnly={readOnly}
                  key={row.id}
                  id={row.id}
                  blockType="array"
                  label={labels.singular}
                  rowCount={rows.length}
                  rowIndex={i}
                  addRow={addRow}
                  removeRow={removeRow}
                  moveRow={moveRow}
                  parentPath={path}
                  fieldTypes={fieldTypes}
                  fieldSchema={fields}
                  permissions={permissions}
                  hasMaxRows={hasMaxRows}
                />
              ))}
              {(rows.length < minRows || (required && rows.length === 0)) && (
                <Banner type="error">
                  This field requires at least
                  {' '}
                  {minRows
                    ? `${minRows} ${labels.plural}`
                    : `1 ${labels.singular}`}
                </Banner>
              )}
              {(rows.length === 0 && readOnly) && (
                <Banner>
                  This field has no
                  {' '}
                  {labels.plural}
                  .
                </Banner>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        {(!readOnly && (!hasMaxRows)) && (
          <div className={`${baseClass}__add-button-wrap`}>
            <Button
              onClick={() => addRow(value)}
              buttonStyle="icon-label"
              icon="plus"
              iconStyle="with-border"
              iconPosition="left"
            >
              {`Add ${labels.singular}`}
            </Button>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default withCondition(ArrayFieldType);
