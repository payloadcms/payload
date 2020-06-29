import React from 'react';
import PropTypes from 'prop-types';

import Button from '../../../elements/Button';
import Popup from '../../../elements/Popup';
import BlockSelector from '../../field-types/Flexible/BlockSelector';

import './index.scss';

const baseClass = 'action-panel';

const ActionPanel = (props) => {
  const {
    addRow, removeRow, singularLabel, verticalAlignment, useFlexibleBlockSelection, blocks, rowIndex,
  } = props;

  console.log(blocks);

  const classes = [
    baseClass,
    `${baseClass}--vertical-alignment-${verticalAlignment}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className={`${baseClass}__controls-container`}>
        <div className={`${baseClass}__controls`}>
          <Popup
            showOnHover
            size="wide"
            color="dark"
            pointerAlignment="center"
            buttonType="custom"
            button={(
              <Button
                className={`${baseClass}__remove-row`}
                round
                buttonStyle="none"
                icon="x"
                iconPosition="left"
                iconStyle="with-border"
                onClick={removeRow}
              />
            )}
          >
            Remove&nbsp;
            {singularLabel}
          </Popup>

          {useFlexibleBlockSelection
            ? (
              <Popup
                buttonType="custom"
                button={(
                  <Button
                    className={`${baseClass}__add-row`}
                    round
                    buttonStyle="none"
                    icon="plus"
                    iconPosition="left"
                    iconStyle="with-border"
                  />
                )}
                render={({ close }) => (
                  <BlockSelector
                    blocks={blocks}
                    addRow={addRow}
                    addRowIndex={rowIndex}
                    close={close}
                  />
                )}
              />
            )
            : (
              <Popup
                showOnHover
                size="wide"
                color="dark"
                pointerAlignment="center"
                buttonType="custom"
                button={(
                  <Button
                    className={`${baseClass}__add-row`}
                    round
                    buttonStyle="none"
                    icon="plus"
                    iconPosition="left"
                    iconStyle="with-border"
                    onClick={addRow}
                  />
                )}
              >
                Add&nbsp;
                {singularLabel}
              </Popup>
            )
          }
        </div>
      </div>
    </div>
  );
};

ActionPanel.defaultProps = {
  singularLabel: 'Row',
  verticalAlignment: 'center',
  useFlexibleBlockSelection: false,
};

ActionPanel.propTypes = {
  singularLabel: PropTypes.string,
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  useFlexibleBlockSelection: PropTypes.bool,
  verticalAlignment: PropTypes.oneOf(['top', 'center', 'sticky']),
};

export default ActionPanel;
