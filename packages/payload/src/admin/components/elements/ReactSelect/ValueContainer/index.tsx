import type { ValueContainerProps } from 'react-select';

import React from 'react';
import { components as SelectComponents } from 'react-select';

import type { Option } from '../types.js';

import './index.scss';

const baseClass = 'value-container';

export const ValueContainer: React.FC<ValueContainerProps<Option, any>> = (props) => {
  const {
    selectProps: {
      // @ts-expect-error // TODO: Fix types
      customProps,
    } = {},
  } = props;

  return (
    <div
      className={baseClass}
      ref={customProps?.droppableRef}
    >
      <SelectComponents.ValueContainer {...props} />
    </div>
  );
};
