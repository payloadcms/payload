import React, { useState } from 'react';
import PropTypes from 'prop-types';

import Button from '../../../elements/Button';
import Popup from '../../../elements/Popup';

import './index.scss';

const baseClass = 'action-handle';

const ActionHandle = (props) => {
  const { addRow, removeRow, singularLabel } = props;

  const [addRowPopupActive, setAddRowPopupActive] = useState(false);
  const [removeRowPopupActive, setRemoveRowPopupActive] = useState(false);

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
            icon="x"
            buttonStyle="icon-label"
            iconPosition="left"
            iconColor="light-gray"
            onClick={() => removeRow()}
          />
        )}
      >
        Remove&nbsp;
        {`${singularLabel ?? 'Row'}`}
      </Popup>

      <Popup
        showOnHover
        size="wide"
        color="dark"
        pointerAlignment="center"
        button={(
          <Button
            className={`${baseClass}__add-row`}
            icon="plus"
            buttonStyle="icon-label"
            iconPosition="left"
            iconColor="light-gray"
            onClick={() => addRow()}
          />
        )}
      >
        Add&nbsp;
        {`${singularLabel ?? 'Row'}`}
      </Popup>
    </div>
  );
};

ActionHandle.defaultProps = {};

ActionHandle.propTypes = {
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
};

export default ActionHandle;
