import React from 'react'
import Link from 'next/link'

import { Gutter } from '../_components/Gutter'

const ComponentsPage: React.FC = () => {
  return (
    <Gutter>
      <h1>Components</h1>
      <Link href="/components/button">Button</Link>
    </Gutter>
  )
}

export default ComponentsPage
