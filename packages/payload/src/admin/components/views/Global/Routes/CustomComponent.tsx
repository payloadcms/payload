import React from 'react'

import type { EditViewProps } from '../../types'

import { API } from '../../API'
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

export const defaultGlobalViews: {
  [key in globalViewType]: React.ComponentType<any>
} = {
  API,
  Default: DefaultGlobalEdit,
  LivePreview: null,
  References: null,
  Relationships: null,
  Version: VersionView,
  Versions: VersionsView,
}

export const CustomGlobalComponent = (
  args: EditViewProps & {
    view: globalViewType
  },
) => {
  if ('global' in args) {
    const { global, view } = args

    const { admin: { components: { views: { Edit } = {} } = {} } = {} } = global

    // Overriding components may come from multiple places in the config
    // Need to cascade through the hierarchy to find the correct component to render
    // For example, the Edit view:
    // 1. Edit?.Default
    // 2. Edit?.Default?.Component
    // TODO: Remove the `@ts-ignore` when a Typescript wizard arrives
    // For some reason `Component` does not exist on type `Edit[view]` no matter how narrow the type is
    const Component =
      typeof Edit === 'object' && typeof Edit[view] === 'function'
        ? Edit[view]
        : typeof Edit === 'object' &&
          typeof Edit?.[view] === 'object' &&
          // @ts-ignore
          typeof Edit[view].Component === 'function'
        ? // @ts-ignore
          Edit[view].Component
        : defaultGlobalViews[view]

    if (Component) {
      return <Component {...args} />
    }
  }

  return null
}
