import React from 'react';
import PropTypes from 'prop-types';

import Button from '../../../elements/Button';

import './index.scss';

const baseClass = 'position-panel';

const PositionPanel = (props) => {
  const {
    dragHandleProps, moveRow, positionIndex, verticalAlignment, rowCount,
  } = props;

  const adjustedIndex = positionIndex + 1;

  const classes = [
    baseClass,
    `${baseClass}--vertical-alignment-${verticalAlignment}`,
  ].filter(Boolean).join(' ');

  console.log(rowCount);
  console.log(positionIndex);
  return (
    <div
      className={classes}
      {...dragHandleProps}
    >
      <div className={`${baseClass}__controls-container`}>
        <div className={`${baseClass}__controls`}>

          <Button
            className={`${baseClass}__move-backward ${positionIndex === 0 ? 'first-row' : ''}`}
            buttonStyle="none"
            icon="chevron"
            round
            onClick={() => moveRow(positionIndex, positionIndex - 1)}
          />

          <div className={`${baseClass}__current-position`}>{adjustedIndex >= 10 ? adjustedIndex : `0${adjustedIndex}`}</div>

          <Button
            className={`${baseClass}__move-forward ${(positionIndex === rowCount - 1) ? 'last-row' : ''}`}
            buttonStyle="none"
            icon="chevron"
            round
            onClick={() => moveRow(positionIndex, positionIndex + 1)}
          />

        </div>
      </div>
    </div>
  );
};

PositionPanel.defaultProps = {
  verticalAlignment: 'center',
};

PositionPanel.propTypes = {
  dragHandleProps: PropTypes.shape({}).isRequired,
  positionIndex: PropTypes.number.isRequired,
  moveRow: PropTypes.func.isRequired,
  verticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
  rowCount: PropTypes.number.isRequired,
};

export default PositionPanel;
