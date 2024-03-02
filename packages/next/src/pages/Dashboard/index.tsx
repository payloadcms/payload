import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { HydrateClientUser, RenderCustomComponent } from '@payloadcms/ui'
import Link from 'next/link'
import { isEntityHidden } from 'payload/utilities'
import React, { Fragment } from 'react'

import type { InitPageResult } from '../../utilities/initPage'
import type { DashboardProps } from './Default'

import { getNextI18n } from '../../utilities/getNextI18n'
import { meta } from '../../utilities/meta'
import { DefaultDashboard } from './Default'

export const generateMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const config = await configPromise

  const { t } = await getNextI18n({
    config,
  })

  return meta({
    config,
    description: `${t('general:dashboard')} Payload`,
    keywords: `${t('general:dashboard')}, Payload`,
    title: t('general:dashboard'),
  })
}

type Args = {
  page: InitPageResult
  searchParams: { [key: string]: string | string[] | undefined }
}

export const Dashboard = async ({ page, searchParams }: Args) => {
  const { permissions, req } = page

  const {
    payload: { config },
    user,
  } = req

  const CustomDashboardComponent = config.admin.components?.views?.Dashboard

  const visibleCollections: string[] = config.collections.reduce((acc, collection) => {
    if (!isEntityHidden({ hidden: collection.admin.hidden, user })) {
      acc.push(collection.slug)
    }
    return acc
  }, [])

  const visibleGlobals: string[] = config.globals.reduce((acc, global) => {
    if (!isEntityHidden({ hidden: global.admin.hidden, user })) {
      acc.push(global.slug)
    }
    return acc
  }, [])

  const componentProps: DashboardProps = {
    Link,
    config,
    visibleCollections,
    visibleGlobals,
  }

  return (
    <Fragment>
      <HydrateClientUser permissions={permissions} user={user} />
      <RenderCustomComponent
        CustomComponent={
          typeof CustomDashboardComponent === 'function' ? CustomDashboardComponent : undefined
        }
        DefaultComponent={DefaultDashboard}
        componentProps={componentProps}
      />
    </Fragment>
  )
}
