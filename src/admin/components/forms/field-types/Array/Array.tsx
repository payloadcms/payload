import React, { useEffect, useReducer, useCallback, useState } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import DraggableSection from '../../DraggableSection';
import reducer from '../rowReducer';
import { useForm } from '../../Form/context';
import buildStateFromSchema from '../../Form/buildStateFromSchema';
import useFieldType from '../../useFieldType';
import Error from '../../Error';
import { array } from '../../../../../fields/validations';
import Banner from '../../../elements/Banner';
import { Props, RenderArrayProps } from './types';

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

  const { dispatchFields } = formContext;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(value, { minRows, maxRows, required });
    return validationResult;
  }, [validate, maxRows, minRows, required]);

  const [disableFormData, setDisableFormData] = useState(false);

  const {
    showError,
    errorMessage,
    value,
    setValue,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    disableFormData,
    ignoreWhileFlattening: true,
  });

  const addRow = useCallback(async (rowIndex) => {
    const subFieldState = await buildStateFromSchema(fields);
    dispatchFields({ type: 'ADD_ROW', rowIndex, subFieldState, path });
    dispatchRows({ type: 'ADD', rowIndex });
    setValue(value as number + 1);
  }, [dispatchRows, dispatchFields, fields, path, setValue, value]);

  const removeRow = useCallback((rowIndex) => {
    dispatchRows({ type: 'REMOVE', rowIndex });
    dispatchFields({ type: 'REMOVE_ROW', rowIndex, path });
  }, [dispatchRows, dispatchFields, path]);

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
    setValue(rows?.length || 0);

    if (rows?.length === 0) {
      setDisableFormData(false);
    } else {
      setDisableFormData(true);
    }
  }, [rows, setValue]);

  return (
    <RenderArray
      onDragEnd={onDragEnd}
      label={label}
      showError={showError}
      errorMessage={errorMessage}
      rows={rows}
      labels={labels}
      addRow={addRow}
      removeRow={removeRow}
      moveRow={moveRow}
      path={path}
      name={name}
      fieldTypes={fieldTypes}
      fields={fields}
      permissions={permissions}
      value={value as number}
      readOnly={readOnly}
      minRows={minRows}
      maxRows={maxRows}
      required={required}
    />
  );
};

const RenderArray = React.memo((props: RenderArrayProps) => {
  const {
    onDragEnd,
    label,
    showError,
    errorMessage,
    rows,
    labels,
    addRow,
    removeRow,
    moveRow,
    path,
    fieldTypes,
    fields,
    permissions,
    value,
    readOnly,
    minRows,
    maxRows,
    required,
  } = props;

  const hasMaxRows = maxRows && rows.length >= maxRows;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className={baseClass}
      >
        <div className={`${baseClass}__error-wrap`}>
          <Error
            showError={showError}
            message={errorMessage}
          />
        </div>
        <header className={`${baseClass}__header`}>
          <h3>{label}</h3>
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
});

export default withCondition(ArrayFieldType);
