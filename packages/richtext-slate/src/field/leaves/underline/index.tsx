import React from 'react'

import UnderlineIcon from '../../icons/Underline'
import LeafButton from '../Button'

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
