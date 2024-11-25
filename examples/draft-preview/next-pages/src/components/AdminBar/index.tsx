import React from 'react'
import type { PayloadAdminBarProps, PayloadMeUser } from 'payload-admin-bar'
import { PayloadAdminBar } from 'payload-admin-bar'

import { Gutter } from '../Gutter'

import classes from './index.module.scss'

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
  setUser?: (user: PayloadMeUser) => void
  user?: PayloadMeUser
}> = (props) => {
  const { adminBarProps, setUser, user } = props

  return (
    <div className={[classes.adminBar, user && classes.show].filter(Boolean).join(' ')}>
      <Gutter className={classes.container}>
        <PayloadAdminBar
          {...adminBarProps}
          className={classes.payloadAdminBar}
          classNames={{
            controls: classes.controls,
            logo: classes.logo,
            user: classes.user,
          }}
          cmsURL={process.env.NEXT_PUBLIC_PAYLOAD_URL}
          logo={<Title />}
          onAuthChange={setUser}
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
