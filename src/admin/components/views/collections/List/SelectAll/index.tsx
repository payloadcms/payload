import React from 'react';
import { SelectAllStatus, useSelection } from '../SelectionProvider';
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
          { (selectAll === SelectAllStatus.AllInPage || selectAll === SelectAllStatus.AllAvailable) && (
            <Check />
          )}
          { selectAll === SelectAllStatus.Some && (
            <Line />
          )}
        </span>
      </button>
    </div>
  );
};

export default SelectAll;
