import React from 'react';
import { components as SelectComponents, ValueContainerProps } from 'react-select';
import { Option } from '../types';

import './index.scss';

const baseClass = 'value-container';

export const ValueContainer: React.FC<ValueContainerProps<Option, any>> = (props) => {
  const {
    selectProps,
  } = props;

  return (
    <div
      ref={selectProps.selectProps.droppableRef}
      className={baseClass}
    >
      <SelectComponents.ValueContainer {...props} />
    </div>
  );
};
