import React from 'react'
import { TextInput } from '@payloadcms/ui/fields/Text'
import Link from 'next/link'

import { Gutter } from '../../_components/Gutter'

const EmailFieldPage: React.FC = () => {
  return (
    <Gutter>
      <Link href="/fields">All Fields</Link>
      <h1 style={{ marginTop: 0 }}>Email Field</h1>
      <TextInput />
    </Gutter>
  )
}

export default EmailFieldPage
