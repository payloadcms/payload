import React from 'react';
import { RowHeaderComponent } from '../../../../src/admin/components/forms/RowHeader/types';

const ArrayRowHeader: RowHeaderComponent = (props) => {
  const { value } = props;
  return <React.Fragment>{value.title || 'enter title'}</React.Fragment>;
};

export default ArrayRowHeader;
