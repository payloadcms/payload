import type { SidebarTab } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { ListViewIcon } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { NavProps } from '../index.js'

import { DEFAULT_NAV_TAB_SLUG } from '../SidebarTabs/constants.js'
import { SidebarRailClient } from './index.client.js'
import './index.scss'

export type SidebarRailProps = {
  i18n: NavProps['i18n']
  tabs: SidebarTab[]
} & Pick<
  NavProps,
  | 'documentSubViewType'
  | 'locale'
  | 'params'
  | 'payload'
  | 'permissions'
  | 'searchParams'
  | 'user'
  | 'viewType'
>

const baseClass = 'sidebar-rail'

export const SidebarRail: React.FC<SidebarRailProps> = (props) => {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    tabs,
    user,
    viewType,
  } = props

  return (
    <SidebarRailClient
      baseClass={baseClass}
      tabs={[
        {
          slug: DEFAULT_NAV_TAB_SLUG,
          icon: <ListViewIcon />,
          isDefaultActive: true,
          label: i18n.t('general:collections'),
        },
        ...tabs.map((tab) => {
          const iconComponent = RenderServerComponent({
            clientProps: {
              documentSubViewType,
              viewType,
            },
            Component: tab.icon,
            importMap: payload.importMap,
            serverProps: {
              i18n,
              locale,
              params,
              payload,
              permissions,
              searchParams,
              user,
            },
          })

          const labelText = tab.label ? getTranslation(tab.label, i18n) : tab.slug

          return {
            slug: tab.slug,
            icon: iconComponent,
            isDefaultActive: tab.isDefaultActive,
            label: labelText,
          }
        }),
      ]}
    />
  )
}
