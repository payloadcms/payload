import React from 'react';
import { useSelection } from '../SelectionProvider';
import Check from '../../../../icons/Check';

import './index.scss';

const baseClass = 'select-row';

const SelectRow: React.FC<{ id: string | number }> = ({ id }) => {
  const { selected, setSelection } = useSelection();

  return (
    <div
      className={[
        baseClass,
        (selected[id]) && `${baseClass}--checked`,
      ].filter(Boolean).join(' ')}
      key={id}
    >
      <button
        type="button"
        onClick={() => setSelection(id)}
      >
        <span className={`${baseClass}__input`}>
          <Check />
        </span>
      </button>
    </div>
  );
};

export default SelectRow;
