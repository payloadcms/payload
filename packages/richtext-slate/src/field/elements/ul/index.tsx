import React from 'react'

import type { RichTextCustomElement } from '../../../types.d.ts'

import ULIcon from '../../icons/UnorderedList/index.js'
import ListButton from '../ListButton.js'
import { UnorderedList } from './UnorderedList.js'

const name = 'ul'

const ul: RichTextCustomElement = {
  name,
  Button: () => (
    <ListButton format={name}>
      <ULIcon />
    </ListButton>
  ),
  Element: UnorderedList,
}

export default ul
