import React from 'react'
import { PayloadAdminBar, PayloadAdminBarProps } from 'payload-admin-bar'

import { useAuth } from '../../providers/Auth'
import { Gutter } from '../Gutter'

import classes from './index.module.scss'

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps: PayloadAdminBarProps
}> = props => {
  const { adminBarProps } = props

  const { user } = useAuth()

  const isAdmin = user?.roles?.includes('admin')

  if (!isAdmin) return null

  return (
    <div className={[classes.adminBar, user && classes.show].filter(Boolean).join(' ')}>
      <Gutter className={classes.blockContainer}>
        <PayloadAdminBar
          {...adminBarProps}
          key={user?.id} // use key to get the admin bar to re-run its `me` request
          cmsURL={process.env.NEXT_PUBLIC_SERVER_URL}
          className={classes.payloadAdminBar}
          classNames={{
            user: classes.user,
            logo: classes.logo,
            controls: classes.controls,
          }}
          logo={<Title />}
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
