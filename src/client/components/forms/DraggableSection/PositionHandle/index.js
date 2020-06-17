import React from 'react';
import PropTypes from 'prop-types';

import Button from '../../../elements/Button';

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
      <div className={`${baseClass}__border-wrap`}>
        <Button
          className={`${baseClass}__move-backward`}
          icon="chevron"
          buttonStyle="icon-label"
          onClick={() => moveRow(positionIndex, positionIndex - 1)}
          removeIconBorder
        />

        <div className={`${baseClass}__current-position`}>{adjustedIndex >= 10 ? adjustedIndex : `0${adjustedIndex}`}</div>

        <Button
          className={`${baseClass}__move-forward`}
          icon="chevron"
          buttonStyle="icon-label"
          onClick={() => moveRow(positionIndex, positionIndex + 1)}
          removeIconBorder
        />
      </div>
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
