'use client'

import React, { useState } from 'react'
import { PayloadAdminBar, PayloadAdminBarProps, PayloadMeUser } from 'payload-admin-bar'

import { Gutter } from '../Gutter'

import classes from './index.module.scss'

export const AdminBarClient: React.FC<PayloadAdminBarProps> = props => {
  const [user, setUser] = useState<PayloadMeUser>()

  return (
    <div className={[classes.adminBar, user && classes.show].filter(Boolean).join(' ')}>
      <Gutter className={classes.container}>
        <PayloadAdminBar
          {...props}
          cmsURL={process.env.NEXT_PUBLIC_CMS_URL}
          onPreviewExit={async () => {
            await fetch(`/api/exit-preview`)
            window.location.reload()
          }}
          onAuthChange={setUser}
          className={classes.payloadAdminBar}
          classNames={{
            user: classes.user,
            logo: classes.logo,
            controls: classes.controls,
          }}
          style={{
            position: 'relative',
            zIndex: 'unset',
            padding: 0,
            backgroundColor: 'transparent',
          }}
        />
      </Gutter>
    </div>
  )
}
