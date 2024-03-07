import React from 'react'

import type { RichTextCustomElement } from '../../../types.js'

import { H5Icon } from '../../icons/headings/H5/index.js'
import { ElementButton } from '../Button.js'
import { Heading5 } from './Heading5.js'

const name = 'h5'

export const h5: RichTextCustomElement = {
  name,
  Button: () => (
    <ElementButton format={name}>
      <H5Icon />
    </ElementButton>
  ),
  Element: Heading5,
}
