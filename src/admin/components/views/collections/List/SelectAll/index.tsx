import React from 'react';
import { useSelection } from '../SelectionProvider';
import Check from '../../../../icons/Check';
import Line from '../../../../icons/Line';

import './index.scss';

const baseClass = 'select-all';

const SelectAll: React.FC = () => {
  const { selectAll, toggleAll } = useSelection();

  return (
    <div
      className={[
        baseClass,
        selectAll !== false && `${baseClass}--checked`,
      ].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        onClick={() => toggleAll()}
      >
        <span className={`${baseClass}__input`}>
          { selectAll === null ? (
            <Line />
          ) : (
            <Check />
          )}
        </span>
      </button>
    </div>
  );
};

export default SelectAll;
