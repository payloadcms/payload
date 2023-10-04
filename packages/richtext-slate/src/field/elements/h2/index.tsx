import React from 'react'

import H2Icon from '../../icons/headings/H2'
import ElementButton from '../Button'

const H2 = ({ attributes, children }) => <h2 {...attributes}>{children}</h2>

const h2 = {
  Button: () => (
    <ElementButton format="h2">
      <H2Icon />
    </ElementButton>
  ),
  Element: H2,
}

export default h2
