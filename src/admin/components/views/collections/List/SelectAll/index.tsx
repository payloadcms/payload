import React from 'react';
import { useSelection } from '../SelectionProvider';
import Check from '../../../../icons/Check';
import More from '../../../../icons/More';

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
        onClick={() => toggleAll(null)}
      >
        <span className={`${baseClass}__input`}>
          { selectAll === null ? (
            <More />
          ) : (
            <Check />
          )}
        </span>
      </button>
    </div>
  );
};

export default SelectAll;
