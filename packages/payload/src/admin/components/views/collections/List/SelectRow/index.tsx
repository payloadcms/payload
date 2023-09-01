import React from 'react';

import { CheckboxInput } from '../../../../forms/field-types/Checkbox/Input';
import { useSelection } from '../SelectionProvider';
import './index.scss';

const SelectRow: React.FC<{ id: number | string }> = ({ id }) => {
  const { selected, setSelection } = useSelection();

  return (
    <CheckboxInput
      checked={selected[id]}
      onToggle={() => setSelection(id)}
    />
  );
};

export default SelectRow;
