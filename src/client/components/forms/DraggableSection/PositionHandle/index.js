import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'position-handle';

const PositionHandle = (props) => {
  const { dragHandleProps, moveRow, positionIndex } = props;

  const adjustedIndex = positionIndex + 1;

  return (
    <div
      className={baseClass}
      {...dragHandleProps}
    >
      <div
        className={`${baseClass}__move-backward`}
        onClick={() => moveRow(positionIndex, positionIndex - 1)}
        role="button"
        tabIndex={0}
      >
        {'<'}
      </div>

      <div className={`${baseClass}__current-position`}>{adjustedIndex >= 10 ? adjustedIndex : `0${adjustedIndex}`}</div>

      <div
        className={`${baseClass}__move-forward`}
        role="button"
        tabIndex={0}
        onClick={() => moveRow(positionIndex, positionIndex + 1)}
      >
        {'>'}
      </div>

      <div className={`${baseClass}__edge-line`} />
    </div>
  );
};

PositionHandle.defaultProps = {};

PositionHandle.propTypes = {
  dragHandleProps: PropTypes.shape({}).isRequired,
  positionIndex: PropTypes.number.isRequired,
  moveRow: PropTypes.func.isRequired,
};

export default PositionHandle;
