import React from 'react';
import ElementButton from '../Button';
import AlignLeftIcon from '../../../../../icons/AlignLeft';
import AlignCenterIcon from '../../../../../icons/AlignCenter';
import AlignRightIcon from '../../../../../icons/AlignRight';

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
