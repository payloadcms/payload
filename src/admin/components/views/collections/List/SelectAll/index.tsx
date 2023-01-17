import React from 'react';
import { useSelection } from '../SelectionProvider';
import Check from '../../../../icons/Check';
import Line from '../../../../icons/Line';

import './index.scss';

const baseClass = 'select-all';

const SelectAll: React.FC = () => {
  const { selectAll, toggleAll } = useSelection();

  return (
    <div className={baseClass}>
      <button
        type="button"
        onClick={() => toggleAll()}
      >
        <span className={`${baseClass}__input`}>
          { selectAll && (
            <Check />
          )}
          { selectAll === null && (
            <Line />
          )}
        </span>
      </button>
    </div>
  );
};

export default SelectAll;
