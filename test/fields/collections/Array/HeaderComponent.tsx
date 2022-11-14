import React from 'react';
import { RowHeaderComponent } from '../../../../src/admin/components/forms/RowHeader/types';

const ArrayRowHeader: RowHeaderComponent = (props) => {
  const { value, index } = props;
  return <React.Fragment>{value.title || `array_${index}`}</React.Fragment>;
};

export default ArrayRowHeader;
