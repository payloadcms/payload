import React from 'react';
import { components as SelectComponents, MultiValueProps } from 'react-select';
import { Option } from '../../../forms/field-types/Relationship/types';
import './index.scss';

const baseClass = 'multi-value-label';

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  const {
    customProps: {
      draggableProps,
    } = {},
  } = props;

  return (
    <div className={baseClass}>
      <SelectComponents.MultiValueLabel
        {...props}
        innerProps={{
          className: `${baseClass}__text`,
          ...draggableProps || {},
        }}
      />
    </div>
  );
};
