import React from 'react';
import { components as SelectComponents, SingleValueProps } from 'react-select';
import { Option } from '../types';

const baseClass = 'react-select--single-value';

export const SingleValue: React.FC<SingleValueProps<Option>> = (props) => {
  const {
    children,
    className,
  } = props;

  return (
    <SelectComponents.SingleValue
      {...props}
      className={[
        baseClass,
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </SelectComponents.SingleValue>
  );
};
