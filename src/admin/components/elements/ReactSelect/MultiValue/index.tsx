import React, { MouseEventHandler } from 'react';
import {
  MultiValueProps,
  components as SelectComponents,
} from 'react-select';
import { useSortable } from '@dnd-kit/sortable';
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
  } = props;

  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: value as string,
  });

  const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    // prevent the dropdown from opening when clicking on the drag handle
    e.preventDefault();
    e.stopPropagation();
  };

  const classes = [
    baseClass,
    className,
    !isDisabled && 'draggable',
  ].filter(Boolean).join(' ');

  return (
    <SelectComponents.MultiValue
      {...props}
      className={classes}
      innerProps={{
        ...innerProps,
        ref: setNodeRef,
        onMouseDown,
        style: {
          ...transform ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          } : {},
        },
      }}
      selectProps={{
        // NOTE: pass the draggable props to the label to act as the draggable handle
        draggableProps: {
          ...attributes,
          ...listeners,
        },
      }}
    />
  );
};
