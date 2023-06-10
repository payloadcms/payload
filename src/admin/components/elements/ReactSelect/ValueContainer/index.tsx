import React from 'react';
import { components as SelectComponents, ValueContainerProps } from 'react-select';
import { Option } from '../types';

import './index.scss';

const baseClass = 'value-container';

export const ValueContainer: React.FC<ValueContainerProps<Option, any>> = (props) => {
  const {
    customProps,
  } = props;

  return (
    <div
      ref={customProps?.droppableRef}
      className={baseClass}
    >
      <SelectComponents.ValueContainer {...props} />
    </div>
  );
};
