'use client'

import React, { useState } from 'react'
import type { PayloadAdminBarProps, PayloadMeUser } from 'payload-admin-bar'
import { PayloadAdminBar } from 'payload-admin-bar'

import { Gutter } from '../Gutter'

import classes from './index.module.scss'

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBarClient: React.FC<PayloadAdminBarProps> = (props) => {
  const [user, setUser] = useState<PayloadMeUser>()

  return (
    <div className={[classes.adminBar, user && classes.show].filter(Boolean).join(' ')}>
      <Gutter className={classes.container}>
        <PayloadAdminBar
          {...props}
          className={classes.payloadAdminBar}
          classNames={{
            controls: classes.controls,
            logo: classes.logo,
            user: classes.user,
          }}
          cmsURL={process.env.NEXT_PUBLIC_PAYLOAD_URL}
          logo={<Title />}
          onAuthChange={setUser}
          onPreviewExit={async () => {
            await fetch(`/api/exit-preview`)
            window.location.reload()
          }}
          style={{
            backgroundColor: 'transparent',
            padding: 0,
            position: 'relative',
            zIndex: 'unset',
          }}
        />
      </Gutter>
    </div>
  )
}
