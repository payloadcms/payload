import React from 'react'

import classes from './index.module.scss'

export const Logo = () => {
  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="Payload Logo"
      className={classes.logo}
      src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/payload/src/admin/assets/images/payload-logo-light.svg"
    />
  )
}
