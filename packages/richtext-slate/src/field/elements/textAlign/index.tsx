import React from 'react'

import type { RichTextCustomElement } from '../../../types.d.ts'

import AlignCenterIcon from '../../icons/AlignCenter/index.js'
import AlignLeftIcon from '../../icons/AlignLeft/index.js'
import AlignRightIcon from '../../icons/AlignRight/index.js'
import ElementButton from '../Button.js'

const alignment: RichTextCustomElement = {
  name: 'alignment',
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
  Element: () => null,
}

export default alignment
