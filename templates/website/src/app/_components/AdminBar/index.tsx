'use client'

import React from 'react'
import { useSelectedLayoutSegments } from 'next/navigation'
import { PayloadAdminBar, PayloadAdminBarProps } from 'payload-admin-bar'

import { User } from '../../../payload/payload-types'
import { Gutter } from '../Gutter'
import { defaultCollectionLabels } from '../PageRange'

import classes from './index.module.scss'

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = props => {
  const { adminBarProps } = props || {}
  const segments = useSelectedLayoutSegments()
  let collection = 'pages'
  if (segments?.[1] === 'projects') collection = 'projects'
  if (segments?.[1] === 'posts') collection = 'posts'
  const [show, setShow] = React.useState(false)

  return (
    <div className={[classes.adminBar, show && classes.show].filter(Boolean).join(' ')}>
      <Gutter className={classes.blockContainer}>
        <PayloadAdminBar
          {...adminBarProps}
          collection={collection}
          collectionLabels={{
            singular: defaultCollectionLabels[collection || 'default']?.singular || 'Page',
            plural: defaultCollectionLabels[collection || 'default']?.plural || 'Pages',
          }}
          cmsURL={process.env.NEXT_PUBLIC_SERVER_URL}
          className={classes.payloadAdminBar}
          classNames={{
            user: classes.user,
            logo: classes.logo,
            controls: classes.controls,
          }}
          onAuthChange={user => {
            let typedUser = user as User // TODO: fix types returned from `onAuthChange` in `payload-admin-bar`
            if (user && typedUser?.roles?.includes('admin')) {
              setShow(true)
            }
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
