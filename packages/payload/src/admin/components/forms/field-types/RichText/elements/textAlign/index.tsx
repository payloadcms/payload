import React from 'react';
import ElementButton from '../Button.js';
import AlignLeftIcon from '../../../../../icons/AlignLeft.js';
import AlignCenterIcon from '../../../../../icons/AlignCenter.js';
import AlignRightIcon from '../../../../../icons/AlignRight.js';

export default {
  name: 'alignment',
  Button: () => {
    return (
      <React.Fragment>
        <ElementButton
          format="left"
          type="textAlign"
        >
          <AlignLeftIcon />
        </ElementButton>
        <ElementButton
          format="center"
          type="textAlign"
        >
          <AlignCenterIcon />
        </ElementButton>
        <ElementButton
          format="right"
          type="textAlign"
        >
          <AlignRightIcon />
        </ElementButton>
      </React.Fragment>
    );
  },
};
