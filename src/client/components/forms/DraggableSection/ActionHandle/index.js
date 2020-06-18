import React from 'react';
import PropTypes from 'prop-types';

import Button from '../../../elements/Button';
import Popup from '../../../elements/Popup';

import './index.scss';

const baseClass = 'action-handle';

const ActionHandle = (props) => {
  const { addRow, removeRow, singularLabel } = props;

  return (
    <div className={baseClass}>
      <Popup
        showOnHover
        size="wide"
        color="dark"
        pointerAlignment="center"
        button={(
          <Button
            className={`${baseClass}__remove-row`}
            round
            buttonStyle="none"
            icon="x"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => removeRow()}
          />
        )}
      >
        Remove&nbsp;
        {singularLabel}
      </Popup>

      <Popup
        showOnHover
        size="wide"
        color="dark"
        pointerAlignment="center"
        button={(
          <Button
            className={`${baseClass}__add-row`}
            round
            buttonStyle="none"
            icon="plus"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => addRow()}
          />
        )}
      >
        Add&nbsp;
        {singularLabel}
      </Popup>
    </div>
  );
};

ActionHandle.defaultProps = {
  singularLabel: 'Row',
};

ActionHandle.propTypes = {
  singularLabel: PropTypes.string,
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
};

export default ActionHandle;
