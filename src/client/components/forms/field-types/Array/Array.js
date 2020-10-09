import React, { useEffect, useReducer, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
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
import getDataByPath from '../../Form/getDataByPath';
import Banner from '../../../elements/Banner';

import './index.scss';

const baseClass = 'field-type array';

const ArrayFieldType = (props) => {
  const {
    label,
    name,
    path: pathFromProps,
    fields,
    fieldTypes,
    validate,
    required,
    maxRows,
    minRows,
    labels,
    permissions,
    admin: {
      readOnly,
    },
  } = props;

  const [rows, dispatchRows] = useReducer(reducer, []);
  const { initialState, dispatchFields } = useForm();

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
    required,
  });

  const addRow = useCallback(async (rowIndex) => {
    const subFieldState = await buildStateFromSchema(fields);
    dispatchFields({ type: 'ADD_ROW', rowIndex, subFieldState, path });
    dispatchRows({ type: 'ADD', rowIndex });
    setValue(value + 1);
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
    const data = getDataByPath(initialState, path);
    dispatchRows({ type: 'SET_ALL', data: data || [] });
  }, [initialState, path]);

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
      value={value}
      readOnly={readOnly}
      minRows={minRows}
      maxRows={maxRows}
    />
  );
};

ArrayFieldType.defaultProps = {
  label: undefined,
  validate: array,
  required: false,
  maxRows: undefined,
  minRows: undefined,
  labels: {
    singular: 'Row',
    plural: 'Rows',
  },
  permissions: {},
  admin: {},
};

ArrayFieldType.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  labels: PropTypes.shape({
    singular: PropTypes.string,
    plural: PropTypes.string,
  }),
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  validate: PropTypes.func,
  required: PropTypes.bool,
  maxRows: PropTypes.number,
  minRows: PropTypes.number,
  permissions: PropTypes.shape({
    fields: PropTypes.shape({}),
  }),
  admin: PropTypes.shape({
    readOnly: PropTypes.bool,
  }),
};

const RenderArray = React.memo((props) => {
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
  } = props;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={baseClass}>
        <header className={`${baseClass}__header`}>
          <h3>{label}</h3>
          <Error
            showError={showError}
            message={errorMessage}
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
                  key={row.key}
                  id={row.key}
                  blockType="array"
                  label={label}
                  isOpen={row.open}
                  rowCount={rows.length}
                  rowIndex={i}
                  addRow={() => addRow(i)}
                  removeRow={() => removeRow(i)}
                  moveRow={moveRow}
                  parentPath={path}
                  initNull={row.initNull}
                  fieldTypes={fieldTypes}
                  fieldSchema={fields}
                  permissions={permissions.fields}
                />
              ))}
              {rows.length < minRows && (
                <Banner type="error">
                  This field requires at least
                  {' '}
                  {minRows}
                  {' '}
                  {labels.plural}
                  .
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
        {!readOnly && (
          <div className={`${baseClass}__add-button-wrap`}>
            <Button
              onClick={() => addRow(value)}
              buttonStyle="icon-label"
              icon="plus"
              iconStyle="with-border"
              iconPosition="left"
            >
              {`Add ${label}`}
            </Button>
          </div>
        )}
      </div>
    </DragDropContext>
  );
});

RenderArray.defaultProps = {
  label: undefined,
  showError: false,
  errorMessage: undefined,
  rows: [],
  labels: {
    singular: 'Row',
    plural: 'Rows',
  },
  path: '',
  value: undefined,
  readOnly: false,
  maxRows: undefined,
  minRows: undefined,
};

RenderArray.propTypes = {
  label: PropTypes.string,
  showError: PropTypes.bool,
  errorMessage: PropTypes.string,
  rows: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  labels: PropTypes.shape({
    singular: PropTypes.string,
    plural: PropTypes.string,
  }),
  path: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.number,
  onDragEnd: PropTypes.func.isRequired,
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  moveRow: PropTypes.func.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  permissions: PropTypes.shape({
    fields: PropTypes.shape({}),
  }).isRequired,
  readOnly: PropTypes.bool,
  maxRows: PropTypes.number,
  minRows: PropTypes.number,
};

export default withCondition(ArrayFieldType);
