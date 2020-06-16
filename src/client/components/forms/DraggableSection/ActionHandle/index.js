import React from 'react';
import PropTypes from 'prop-types';

import Button from '../../../elements/Button';

import './index.scss';

const baseClass = 'action-handle';

const ActionHandle = (props) => {
  const { addRow, removeRow } = props;

  return (
    <div className={baseClass}>
      <Button
        className={`${baseClass}__remove-row`}
        icon="x"
        buttonStyle="icon-label"
        iconPosition="left"
        onClick={() => removeRow()}
      />

      <Button
        className={`${baseClass}__add-row`}
        icon="plus"
        buttonStyle="icon-label"
        iconPosition="left"
        onClick={() => addRow()}
      />
    </div>
  );
};

ActionHandle.defaultProps = {};

ActionHandle.propTypes = {
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
};

export default ActionHandle;
