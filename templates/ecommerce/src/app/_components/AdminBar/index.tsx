'use client'

import React, { useEffect } from 'react'
import { useSelectedLayoutSegments } from 'next/navigation'
import { PayloadAdminBar, PayloadAdminBarProps } from 'payload-admin-bar'

import { useAuth } from '../../_providers/Auth'
import { Gutter } from '../Gutter'

import classes from './index.module.scss'

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = props => {
  const { adminBarProps } = props || {}
  const segments = useSelectedLayoutSegments()
  const collection = segments?.[1] === 'products' ? 'products' : 'pages'
  const [show, setShow] = React.useState(false)

  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      setShow(true)
    }
  }, [user])

  const isAdmin = user?.roles?.includes('admin')

  if (!isAdmin) return null

  return (
    <div className={[classes.adminBar, show && classes.show].filter(Boolean).join(' ')}>
      <Gutter className={classes.blockContainer}>
        <PayloadAdminBar
          {...adminBarProps}
          collection={collection}
          collectionLabels={{
            singular: collection === 'products' ? 'Product' : 'Page',
            plural: collection === 'products' ? 'Products' : 'Pages',
          }}
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
