import React from 'react'

import UnderlineIcon from '../../../../../icons/Underline/index.js'
import LeafButton from '../Button.js'

const Underline = ({ attributes, children }) => <u {...attributes}>{children}</u>

const underline = {
  Button: () => (
    <LeafButton format="underline">
      <UnderlineIcon />
    </LeafButton>
  ),
  Leaf: Underline,
}

export default underline
