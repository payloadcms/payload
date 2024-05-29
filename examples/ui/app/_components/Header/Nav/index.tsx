import React from 'react'
import Link from 'next/link'

import classes from './index.module.scss'

export const HeaderNav: React.FC = () => {
  return (
    <nav className={classes.nav}>
      <Link href="/fields">Fields</Link>
      <Link href="/components">Components</Link>
    </nav>
  )
}
