import React from 'react'

import H5Icon from '../../icons/headings/H5'
import ElementButton from '../Button'

const H5 = ({ attributes, children }) => <h5 {...attributes}>{children}</h5>

const h5 = {
  Button: () => (
    <ElementButton format="h5">
      <H5Icon />
    </ElementButton>
  ),
  Element: H5,
}

export default h5
