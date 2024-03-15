'use client'

import type { PayloadAdminBarProps } from 'payload-admin-bar'

import { useSelectedLayoutSegments } from 'next/navigation'
import { PayloadAdminBar } from 'payload-admin-bar'
import React, { useEffect } from 'react'

import { useAuth } from '../../_providers/Auth'
import { Gutter } from '../Gutter'
import classes from './index.module.scss'

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = (props) => {
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
          className={classes.payloadAdminBar}
          classNames={{
            controls: classes.controls,
            logo: classes.logo,
            user: classes.user,
          }}
          cmsURL={process.env.NEXT_PUBLIC_SERVER_URL}
          collection={collection}
          collectionLabels={{
            plural: collection === 'products' ? 'Products' : 'Pages',
            singular: collection === 'products' ? 'Product' : 'Page',
          }}
          key={user?.id} // use key to get the admin bar to re-run its `me` request
          logo={<Title />}
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
