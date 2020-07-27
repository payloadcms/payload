import React, {
  useEffect, useReducer, useCallback, useState,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import reducer from '../rowReducer';
import { useForm } from '../../Form/context';
import DraggableSection from '../../DraggableSection';
import { useRenderedFields } from '../../RenderFields';
import Error from '../../Error';
import useFieldType from '../../useFieldType';
import Popup from '../../../elements/Popup';
import BlockSelector from './BlockSelector';
import { blocks as blocksValidator } from '../../../../../fields/validations';

import './index.scss';

const baseClass = 'field-type blocks';

const Blocks = (props) => {
  const {
    label,
    name,
    path: pathFromProps,
    blocks,
    singularLabel,
    fieldTypes,
    maxRows,
    minRows,
    required,
    validate,
    permissions,
  } = props;

  const path = pathFromProps || name;

  const [rows, dispatchRows] = useReducer(reducer, []);
  const { customComponentsPath } = useRenderedFields();
  const { getDataByPath, initialState, dispatchFields } = useForm();

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(
      value,
      {
        minRows, maxRows, singularLabel, blocks, required,
      },
    );
    return validationResult;
  }, [validate, maxRows, minRows, singularLabel, blocks, required]);

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

  const addRow = useCallback((rowIndex, blockType) => {
    const block = blocks.find((potentialBlock) => potentialBlock.slug === blockType);

    dispatchRows({ type: 'ADD', rowIndex, blockType });
    dispatchFields({ type: 'ADD_ROW', rowIndex, fieldSchema: block.fields, path, blockType });
    setValue(value + 1);
  }, [path, setValue, value, blocks, dispatchFields]);

  const removeRow = useCallback((rowIndex) => {
    dispatchRows({ type: 'REMOVE', rowIndex });
    dispatchFields({ type: 'REMOVE_ROW', rowIndex, path });
    setValue(value - 1);
  }, [path, setValue, value, dispatchFields]);

  const moveRow = useCallback((moveFromIndex, moveToIndex) => {
    dispatchRows({ type: 'MOVE', moveFromIndex, moveToIndex });
    dispatchFields({ type: 'MOVE_ROW', moveFromIndex, moveToIndex, path });
  }, [dispatchRows, dispatchFields, path]);

  const toggleCollapse = useCallback((rowIndex) => {
    dispatchRows({ type: 'TOGGLE_COLLAPSE', rowIndex });
  }, []);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  }, [moveRow]);

  useEffect(() => {
    const data = getDataByPath(path);
    dispatchRows({ type: 'SET_ALL', data });
  }, [initialState, getDataByPath, path]);

  useEffect(() => {
    setValue(rows?.length || 0);

    if (rows?.length === 0) {
      setDisableFormData(false);
    } else {
      setDisableFormData(true);
    }
  }, [rows, setValue]);

  return (
    <RenderBlocks
      onDragEnd={onDragEnd}
      label={label}
      showError={showError}
      errorMessage={errorMessage}
      rows={rows}
      singularLabel={singularLabel}
      addRow={addRow}
      removeRow={removeRow}
      moveRow={moveRow}
      path={path}
      customComponentsPath={customComponentsPath}
      name={name}
      fieldTypes={fieldTypes}
      toggleCollapse={toggleCollapse}
      permissions={permissions}
      value={value}
      blocks={blocks}
    />
  );
};

Blocks.defaultProps = {
  label: '',
  singularLabel: 'Block',
  validate: blocksValidator,
  required: false,
  maxRows: undefined,
  minRows: undefined,
  permissions: {},
};

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  singularLabel: PropTypes.string,
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
};

const RenderBlocks = React.memo((props) => {
  const {
    onDragEnd,
    label,
    showError,
    errorMessage,
    rows,
    singularLabel,
    addRow,
    removeRow,
    moveRow,
    path,
    customComponentsPath,
    name,
    fieldTypes,
    permissions,
    value,
    toggleCollapse,
    blocks,
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

        <Droppable droppableId="blocks-drop">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {rows.length > 0 && rows.map((row, i) => {
                const { blockType } = row;
                const blockToRender = blocks.find((block) => block.slug === blockType);

                if (blockToRender) {
                  return (
                    <DraggableSection
                      key={row.key}
                      id={row.key}
                      blockType="blocks"
                      blocks={blocks}
                      singularLabel={blockToRender?.labels?.singular}
                      isOpen={row.open}
                      rowCount={rows.length}
                      rowIndex={i}
                      addRow={addRow}
                      removeRow={() => removeRow(i)}
                      moveRow={moveRow}
                      toggleRowCollapse={() => toggleCollapse(i)}
                      parentPath={path}
                      customComponentsPath={`${customComponentsPath}${name}.fields.`}
                      fieldTypes={fieldTypes}
                      permissions={permissions.fields}
                      fieldSchema={[
                        ...blockToRender.fields,
                        {
                          name: 'blockType',
                          type: 'text',
                          admin: {
                            hidden: true,
                          },
                        },
                      ]}
                    />
                  );
                }

                return null;
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <div className={`${baseClass}__add-button-wrap`}>
          <Popup
            buttonType="custom"
            size="large"
            horizontalAlign="left"
            button={(
              <Button
                buttonStyle="icon-label"
                icon="plus"
                iconPosition="left"
                iconStyle="with-border"
              >
                {`Add ${singularLabel}`}
              </Button>
            )}
            render={({ close }) => (
              <BlockSelector
                blocks={blocks}
                addRow={addRow}
                addRowIndex={value}
                close={close}
              />
            )}
          />
        </div>
      </div>
    </DragDropContext>
  );
});

RenderBlocks.defaultProps = {
  label: undefined,
  showError: false,
  errorMessage: undefined,
  rows: [],
  singularLabel: 'Row',
  path: '',
  customComponentsPath: undefined,
  value: undefined,
};

RenderBlocks.propTypes = {
  label: PropTypes.string,
  showError: PropTypes.bool,
  errorMessage: PropTypes.string,
  rows: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  singularLabel: PropTypes.string,
  path: PropTypes.string,
  customComponentsPath: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.number,
  onDragEnd: PropTypes.func.isRequired,
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  moveRow: PropTypes.func.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  permissions: PropTypes.shape({
    fields: PropTypes.shape({}),
  }).isRequired,
  blocks: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  toggleCollapse: PropTypes.func.isRequired,
};

export default withCondition(Blocks);
