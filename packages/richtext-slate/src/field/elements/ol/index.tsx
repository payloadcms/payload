import React from 'react'

import type { RichTextCustomElement } from '../../../types.d.ts'

import OLIcon from '../../icons/OrderedList/index.js'
import ListButton from '../ListButton.js'
import { OrderedList } from './OrderedList.js'

const name = 'ol'

const ol: RichTextCustomElement = {
  name,
  Button: () => (
    <ListButton format={name}>
      <OLIcon />
    </ListButton>
  ),
  Element: OrderedList,
}

export default ol
