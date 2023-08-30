import React from 'react'

import AlignCenterIcon from '../../../../../icons/AlignCenter/index.js'
import AlignLeftIcon from '../../../../../icons/AlignLeft/index.js'
import AlignRightIcon from '../../../../../icons/AlignRight/index.js'
import ElementButton from '../Button.js'

export default {
  Button: () => {
    return (
      <React.Fragment>
        <ElementButton format="left" type="textAlign">
          <AlignLeftIcon />
        </ElementButton>
        <ElementButton format="center" type="textAlign">
          <AlignCenterIcon />
        </ElementButton>
        <ElementButton format="right" type="textAlign">
          <AlignRightIcon />
        </ElementButton>
      </React.Fragment>
    )
  },
  name: 'alignment',
}
