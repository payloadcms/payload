import React from 'react';
import Button from '../../../elements/Button';
import { Props } from './types';

import './index.scss';

const baseClass = 'position-panel';

const PositionPanel: React.FC<Props> = (props) => {
  const { moveRow, positionIndex, rowCount, readOnly } = props;

  const adjustedIndex = positionIndex + 1;

  const classes = [
    baseClass,
    `${baseClass}__${readOnly ? 'read-only' : ''}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {!readOnly && (
        <Button
          className={`${baseClass}__move-backward ${positionIndex === 0 ? 'first-row' : ''}`}
          buttonStyle="none"
          icon="chevron"
          round
          onClick={() => moveRow(positionIndex, positionIndex - 1)}
        />
      )}

      {(adjustedIndex && typeof positionIndex === 'number')
        && (
        <div
          className={`${baseClass}__current-position`}
        >
          {adjustedIndex >= 10 ? adjustedIndex : `0${adjustedIndex}`}
        </div>
        )}

      {!readOnly && (
        <Button
          className={`${baseClass}__move-forward ${(positionIndex === rowCount - 1) ? 'last-row' : ''}`}
          buttonStyle="none"
          icon="chevron"
          round
          onClick={() => moveRow(positionIndex, positionIndex + 1)}
        />
      )}
    </div>
  );
};

export default PositionPanel;
