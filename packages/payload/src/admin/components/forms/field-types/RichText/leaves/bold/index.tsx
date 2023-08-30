import React from 'react'

import BoldIcon from '../../../../../icons/Bold/index.js'
import LeafButton from '../Button.js'

const Bold = ({ attributes, children }) => <strong {...attributes}>{children}</strong>

const bold = {
  Button: () => (
    <LeafButton format="bold">
      <BoldIcon />
    </LeafButton>
  ),
  Leaf: Bold,
}

export default bold
