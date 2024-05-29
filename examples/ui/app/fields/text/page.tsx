import React from 'react'
import Link from 'next/link'

import { Gutter } from '../../_components/Gutter'
import { CustomTextField } from './Field'

const TextFieldPage: React.FC = () => {
  return (
    <Gutter>
      <Link href="/fields">All Fields</Link>
      <h1 style={{ marginTop: 0 }}>Text Field</h1>
      <CustomTextField />
    </Gutter>
  )
}

export default TextFieldPage
