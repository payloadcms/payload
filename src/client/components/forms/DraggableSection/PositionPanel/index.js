import React from 'react';
import PropTypes from 'prop-types';

import Button from '../../../elements/Button';

import './index.scss';

const baseClass = 'position-panel';

const PositionPanel = (props) => {
  const { moveRow, positionIndex, rowCount } = props;

  const adjustedIndex = positionIndex + 1;

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Button
        className={`${baseClass}__move-backward ${positionIndex === 0 ? 'first-row' : ''}`}
        buttonStyle="none"
        icon="chevron"
        round
        onClick={() => moveRow(positionIndex, positionIndex - 1)}
      />

      {(adjustedIndex && typeof positionIndex === 'number')
        && <div className={`${baseClass}__current-position`}>{adjustedIndex >= 10 ? adjustedIndex : `0${adjustedIndex}`}</div>}

      <Button
        className={`${baseClass}__move-forward ${(positionIndex === rowCount - 1) ? 'last-row' : ''}`}
        buttonStyle="none"
        icon="chevron"
        round
        onClick={() => moveRow(positionIndex, positionIndex + 1)}
      />
    </div>
  );
};

PositionPanel.defaultProps = {
  positionIndex: null,
};

PositionPanel.propTypes = {
  positionIndex: PropTypes.number,
  moveRow: PropTypes.func.isRequired,
  rowCount: PropTypes.number.isRequired,
};

export default PositionPanel;
