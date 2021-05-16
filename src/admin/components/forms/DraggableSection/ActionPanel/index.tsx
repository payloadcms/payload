import React from 'react';

import Button from '../../../elements/Button';
import Popup from '../../../elements/Popup';
import BlockSelector from '../../field-types/Blocks/BlockSelector';
import { Props } from './types';

import './index.scss';

const baseClass = 'action-panel';

const ActionPanel: React.FC<Props> = (props) => {
  const {
    addRow,
    removeRow,
    label = 'Row',
    blockType,
    blocks = [],
    rowIndex,
    isHovered,
    hasMaxRows,
  } = props;

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Popup
        showOnHover
        size="wide"
        color="dark"
        horizontalAlign="right"
        buttonType="custom"
        button={(
          <Button
            className={`${baseClass}__remove-row`}
            round
            buttonStyle="none"
            icon="x"
            iconPosition="left"
            iconStyle="with-border"
            onClick={() => removeRow(rowIndex)}
          />
        )}
      >
        Remove&nbsp;
        {label}
      </Popup>

      {!hasMaxRows && (
        <React.Fragment>
          {blockType === 'blocks'
            ? (
              <Popup
                buttonType="custom"
                size="large"
                horizontalAlign="right"
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
                    parentIsHovered={isHovered}
                    watchParentHover
                  />
                )}
              />
            )
            : (
              <Popup
                showOnHover
                size="wide"
                color="dark"
                horizontalAlign="center"
                buttonType="custom"
                button={(
                  <Button
                    className={`${baseClass}__add-row`}
                    round
                    buttonStyle="none"
                    icon="plus"
                    iconPosition="left"
                    iconStyle="with-border"
                    onClick={() => addRow(rowIndex)}
                  />
              )}
              >
                Add&nbsp;
                {label}
              </Popup>
            )}
        </React.Fragment>
      )}
    </div>
  );
};

export default ActionPanel;
