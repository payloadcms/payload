import React from 'react'

import type { Props } from '../types'

import VersionView from '../../Version/Version'
import VersionsView from '../../Versions'
import { DefaultGlobalEdit } from '../Default/index'

export type globalViewType =
  | 'API'
  | 'Default'
  | 'LivePreview'
  | 'References'
  | 'Relationships'
  | 'Version'
  | 'Versions'

const defaultViews: {
  [key in globalViewType]: React.ComponentType<any>
} = {
  API: null,
  Default: DefaultGlobalEdit,
  LivePreview: null,
  References: null,
  Relationships: null,
  Version: VersionView,
  Versions: VersionsView,
}

export const CustomGlobalComponent = (
  args: Props & {
    view: globalViewType
  },
) => {
  const { global, view } = args

  const { admin: { components: { views: { Edit } = {} } = {} } = {} } = global

  // Overriding components may come from multiple places in the config
  // Need to cascade through the hierarchy to find the correct component to render
  // For example, the Edit view:
  // 1. Edit?.Default
  // 2. Edit?.Default?.Component
  const Component =
    typeof Edit === 'object' && typeof Edit[view] === 'function'
      ? Edit[view]
      : typeof Edit === 'object' &&
        typeof Edit?.[view] === 'object' &&
        typeof Edit[view].Component === 'function'
      ? Edit[view].Component
      : defaultViews[view]

  if (Component) {
    return <Component {...args} />
  }

  return null
}
