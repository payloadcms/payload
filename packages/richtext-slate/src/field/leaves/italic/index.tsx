import React from 'react'

import ItalicIcon from '../../icons/Italic'
import LeafButton from '../Button'

const Italic = ({ attributes, children }) => <em {...attributes}>{children}</em>

const italic = {
  Button: () => (
    <LeafButton format="italic">
      <ItalicIcon />
    </LeafButton>
  ),
  Leaf: Italic,
}

export default italic
