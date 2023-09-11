import React from 'react'

import H1Icon from '../../icons/headings/H1'
import ElementButton from '../Button'

const H1 = ({ attributes, children }) => <h1 {...attributes}>{children}</h1>

const h1 = {
  Button: () => (
    <ElementButton format="h1">
      <H1Icon />
    </ElementButton>
  ),
  Element: H1,
}

export default h1
