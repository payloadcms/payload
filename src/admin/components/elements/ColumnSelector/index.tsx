import React, { useCallback, useEffect, useId, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import flattenTopLevelFields from '../../../../utilities/flattenTopLevelFields';
import Pill from '../Pill';
import Plus from '../../icons/Plus';
import X from '../../icons/X';
import DragHandle from '../../icons/Drag';
import { Props } from './types';
import { getTranslation } from '../../../../utilities/getTranslation';
import { useEditDepth } from '../../utilities/EditDepth';
import './index.scss';

const baseClass = 'column-selector';

const ColumnSelector: React.FC<Props> = (props) => {
  const {
    collection,
    columns,
    setColumns,
  } = props;

  const [fields, setFields] = useState(() => flattenTopLevelFields(collection.fields, true));

  useEffect(() => {
    setFields(flattenTopLevelFields(collection.fields, true));
  }, [collection.fields]);

  const { i18n } = useTranslation();
  const uuid = useId();
  const editDepth = useEditDepth();

  const moveColumn = useCallback((moveFromIndex: number, moveToIndex: number) => {
    console.log(moveFromIndex, moveToIndex);
    const newState = [...fields];
    const element = fields[moveFromIndex];
    newState.splice(moveFromIndex, 1);
    newState.splice(moveToIndex, 0, element);
    setFields(newState);
    setColumns(newState.filter((field) => columns.find((column) => column === field.name)).map((field) => field.name));
  }, [columns, fields, setColumns, setFields]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveColumn(sourceIndex, destinationIndex);
  }, [moveColumn]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable
        droppableId="columns-drop"
        isDropDisabled={false}
        direction="horizontal"
      >
        {(provided) => (
          <div
            className={baseClass}
            style={{ display: 'flex' }}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {fields && fields.map((field, i) => {
              const isEnabled = columns.find((column) => column === field.name);
              return (
                <Draggable
                  key={field.name}
                  draggableId={field.name}
                  index={i}
                  isDragDisabled={false}
                >
                  {(providedDrag) => (
                    <div
                      id={`col-${i}`}
                      ref={providedDrag.innerRef}
                      {...providedDrag.draggableProps}
                    >
                      <span
                        className={`${baseClass}__drag`}
                        {...providedDrag.dragHandleProps}
                      >
                        <DragHandle />
                      </span>
                      <Pill
                        onClick={() => {
                          let newState = [...columns];
                          if (isEnabled) {
                            newState = newState.filter((remainingColumn) => remainingColumn !== field.name);
                          } else {
                            newState.unshift(field.name);
                          }

                          setColumns(newState);
                        }}
                        alignIcon="left"
                        key={`${field.name || i}${editDepth ? `-${editDepth}-` : ''}${uuid}`}
                        icon={isEnabled ? <X /> : <Plus />}
                        className={[
                          `${baseClass}__column`,
                          isEnabled && `${baseClass}__column--active`,
                        ].filter(Boolean).join(' ')}
                      >
                        {getTranslation(field.label || field.name, i18n)}
                      </Pill>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default ColumnSelector;
