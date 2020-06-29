import React, {
  useEffect, useReducer, useState, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import reducer from '../rowReducer';
import useForm from '../../Form/useForm';
import DraggableSection from '../../DraggableSection';
import { useRenderedFields } from '../../RenderFields';
import Error from '../../Error';
import useFieldType from '../../useFieldType';
import Popup from '../../../elements/Popup';
import BlockSelector from './BlockSelector';
import { flexible } from '../../../../../fields/validations';

import './index.scss';

const baseClass = 'field-type flexible';

const Flexible = (props) => {
  const {
    label,
    name,
    path: pathFromProps,
    blocks,
    defaultValue,
    initialData,
    singularLabel,
    fieldTypes,
    maxRows,
    minRows,
    required,
    validate,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(
      value,
      {
        minRows, maxRows, singularLabel, blocks, required,
      },
    );
    return validationResult;
  }, [validate, maxRows, minRows, singularLabel, blocks, required]);

  const {
    showError,
    errorMessage,
    value,
    setValue,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    disableFormData: true,
    initialData: initialData?.length,
    defaultValue: defaultValue?.length,
    required,
  });

  const dataToInitialize = initialData || defaultValue;
  const [rows, dispatchRows] = useReducer(reducer, []);
  const { customComponentsPath } = useRenderedFields();
  const { getDataByPath } = useForm();

  const addRow = (index, blockType) => {
    const data = getDataByPath(path);

    dispatchRows({
      type: 'ADD', index, data, initialRowData: { blockType },
    });

    setValue(value + 1);
  };

  const removeRow = (index) => {
    const data = getDataByPath(path);

    dispatchRows({
      type: 'REMOVE',
      index,
      data,
    });

    setValue(value - 1);
  };

  const moveRow = (moveFromIndex, moveToIndex) => {
    const data = getDataByPath(path);

    dispatchRows({
      type: 'MOVE', index: moveFromIndex, moveToIndex, data,
    });
  };

  const toggleCollapse = (index) => {
    dispatchRows({
      type: 'TOGGLE_COLLAPSE', index, rows,
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  };

  useEffect(() => {
    dispatchRows({
      type: 'SET_ALL',
      rows: dataToInitialize.reduce((acc, data) => ([
        ...acc,
        {
          key: uuidv4(),
          open: true,
          data,
        },
      ]), []),
    });
  }, [dataToInitialize]);

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

        <Droppable droppableId="flexible-drop">
          {provided => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {rows.length > 0 && rows.map((row, i) => {
                let { blockType } = row.data;

                if (!blockType) {
                  blockType = dataToInitialize?.[i]?.blockType;
                }

                const blockToRender = blocks.find(block => block.slug === blockType);

                if (blockToRender) {
                  return (
                    <DraggableSection
                      isOpen={row.open}
                      fieldTypes={fieldTypes}
                      key={row.key}
                      id={row.key}
                      parentPath={path}
                      moveRow={moveRow}
                      addRow={addRow}
                      removeRow={() => removeRow(i)}
                      toggleRowCollapse={() => toggleCollapse(i)}
                      rowIndex={i}
                      fieldSchema={[
                        ...blockToRender.fields,
                        {
                          name: 'blockType',
                          type: 'text',
                          hidden: 'admin',
                        }, {
                          name: 'blockName',
                          type: 'text',
                          hidden: 'admin',
                        },
                      ]}
                      singularLabel={blockToRender?.labels?.singular}
                      initialData={row.data}
                      dispatchRows={dispatchRows}
                      blockType="flexible"
                      customComponentsPath={`${customComponentsPath}${name}.fields.`}
                      useFlexibleBlockSelection
                      blocks={blocks}
                    />
                  );
                }

                return null;
              })
                }
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
};

Flexible.defaultProps = {
  label: '',
  defaultValue: [],
  initialData: [],
  singularLabel: 'Block',
  validate: flexible,
  required: false,
  maxRows: undefined,
  minRows: undefined,
};

Flexible.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  initialData: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
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
};

export default withCondition(Flexible);
