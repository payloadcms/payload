import React from 'react';
import { components as SelectComponents, SingleValueProps } from 'react-select';
import { Option } from '../types';
import './index.scss';

const baseClass = 'react-select--single-value';

export const SingleValue: React.FC<SingleValueProps<Option>> = (props) => {
  const {
    children,
  } = props;

  return (
    <div className={baseClass}>
      <SelectComponents.SingleValue {...props}>
        {children}
      </SelectComponents.SingleValue>
    </div>
  );
};
