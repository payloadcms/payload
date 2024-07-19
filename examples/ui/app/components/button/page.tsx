import React from 'react'
import { Button } from '@payloadcms/ui/components/Button'
import Link from 'next/link'

import { Gutter } from '../../_components/Gutter'

const ButtonComponentPage: React.FC = () => {
  return (
    <Gutter>
      <Link href="/components">All Components</Link>
      <h1 style={{ marginTop: 0 }}>Button Component</h1>
      <Button />
    </Gutter>
  )
}

export default ButtonComponentPage
