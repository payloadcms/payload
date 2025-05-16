'use client'

import type { PayloadAdminBarProps } from '@payloadcms/admin-bar'

import { useRouter } from 'next/navigation'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React, { useState } from 'react'

import { Gutter } from '../Gutter'
import classes from './index.module.scss'

const collectionLabels = {
  pages: {
    plural: 'Pages',
    singular: 'Page',
  },
}

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = (props) => {
  const { adminBarProps } = props || {}
  const [show, setShow] = useState(false)
  const collection = 'pages'
  const router = useRouter()

  const onAuthChange = React.useCallback((user) => {
    setShow(user?.id)
  }, [])

  return (
    <div className={[classes.adminBar, show && classes.show].filter(Boolean).join(' ')}>
      <Gutter className={classes.container}>
        <PayloadAdminBar
          {...adminBarProps}
          className={classes.payloadAdminBar}
          classNames={{
            controls: classes.controls,
            logo: classes.logo,
            user: classes.user,
          }}
          cmsURL={process.env.NEXT_PUBLIC_SERVER_URL}
          collectionSlug={collection}
          collectionLabels={{
            plural: collectionLabels[collection]?.plural || 'Pages',
            singular: collectionLabels[collection]?.singular || 'Page',
          }}
          logo={<Title />}
          onAuthChange={onAuthChange}
          onPreviewExit={() => {
            fetch('/next/exit-preview')
              .then(() => {
                router.push('/')
                router.refresh()
              })
              .catch((error) => {
                console.error('Error exiting preview:', error)
              })
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
