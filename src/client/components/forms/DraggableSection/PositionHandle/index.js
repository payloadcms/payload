import React from 'react';
import PropTypes from 'prop-types';

import Button from '../../../elements/Button';

import './index.scss';

const baseClass = 'position-handle';

const PositionHandle = (props) => {
  const {
    dragHandleProps, moveRow, positionIndex, verticalAlignment,
  } = props;

  const adjustedIndex = positionIndex + 1;

  const classes = [
    baseClass,
    `${baseClass}--vertical-alignment-${verticalAlignment}`,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      {...dragHandleProps}
    >
      <div className={`${baseClass}__controls-container`}>
        <div className={`${baseClass}__controls`}>
          <Button
            className={`${baseClass}__move-backward`}
            buttonStyle="none"
            icon="chevron"
            round
            onClick={() => moveRow(positionIndex, positionIndex - 1)}
          />

          <div className={`${baseClass}__current-position`}>{adjustedIndex >= 10 ? adjustedIndex : `0${adjustedIndex}`}</div>

          <Button
            className={`${baseClass}__move-forward`}
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

PositionHandle.defaultProps = {
  verticalAlignment: 'center',
};

PositionHandle.propTypes = {
  dragHandleProps: PropTypes.shape({}).isRequired,
  positionIndex: PropTypes.number.isRequired,
  moveRow: PropTypes.func.isRequired,
  verticalAlignment: PropTypes.oneOf(['top', 'center']),
};

export default PositionHandle;
