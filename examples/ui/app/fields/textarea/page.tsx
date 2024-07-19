import React from 'react'
import Link from 'next/link'

import { Gutter } from '../../_components/Gutter'
import { CustomTextareaField } from './Field'

const TextareaFieldPage: React.FC = () => {
  return (
    <Gutter>
      <Link href="/fields">All Fields</Link>
      <h1 style={{ marginTop: 0 }}>Textarea Field</h1>
      <CustomTextareaField />
    </Gutter>
  )
}

export default TextareaFieldPage
