import React from 'react';
import { useSelection } from '../SelectionProvider/index.js';
import { CheckboxInput } from '../../../../forms/field-types/Checkbox/Input.js';

import './index.scss';

const SelectRow: React.FC<{ id: string | number }> = ({ id }) => {
  const { selected, setSelection } = useSelection();

  return (
    <CheckboxInput
      checked={selected[id]}
      onToggle={() => setSelection(id)}
    />
  );
};

export default SelectRow;
