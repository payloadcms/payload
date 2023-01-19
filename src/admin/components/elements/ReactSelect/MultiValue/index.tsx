import React from 'react';
import {
  MultiValueProps,
  components as SelectComponents,
} from 'react-select';
import DraggableSortableItem from '../../DraggableSortable/DraggableSortableItem';
import { Option as OptionType } from '../types';

import './index.scss';

const baseClass = 'multi-value';

export const MultiValue: React.FC<MultiValueProps<OptionType>> = (props) => {
  const {
    className,
    isDisabled,
    innerProps,
    data: {
      value,
    },
    selectProps: {
      selectProps,
      selectProps: {
        disableMouseDown,
      },
    },
  } = props;

  const classes = [
    baseClass,
    className,
    !isDisabled && 'draggable',
  ].filter(Boolean).join(' ');

  return (
    <DraggableSortableItem id={value as string}>
      {({ setNodeRef, transform, attributes, listeners }) => (
        <SelectComponents.MultiValue
          {...props}
          className={classes}
          innerProps={{
            ...innerProps,
            ref: setNodeRef,
            onMouseDown: (e) => {
              if (!disableMouseDown) {
                // we need to prevent the dropdown from opening when clicking on the drag handle, but not when a modal is open (i.e. the 'Relationship' field component)
                e.preventDefault();
                e.stopPropagation();
              }
            },
            style: {
              transform,
            },
          }}
          selectProps={{
            ...selectProps,
            // pass the draggable props through to the label so it alone acts as the draggable handle
            draggableProps: {
              ...attributes,
              ...listeners,
            },
          }}
        />
      )}
    </DraggableSortableItem>
  );
};
