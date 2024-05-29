import React from 'react'
import Link from 'next/link'

import { Gutter } from '../_components/Gutter'

const FieldsPage: React.FC = () => {
  return (
    <Gutter>
      <h1>Fields</h1>
      <Link href="/fields/text">Text Field</Link>
      <br />
      <Link href="/fields/textarea">Textarea Field</Link>
      <br />
      <Link href="/fields/email">Email Field</Link>
    </Gutter>
  )
}

export default FieldsPage
