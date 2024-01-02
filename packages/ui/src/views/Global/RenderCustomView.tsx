import React from 'react'

import type { GlobalEditViewProps } from '../types'

import { DefaultGlobalEdit } from './Default/index'

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
  API: null,
  Default: DefaultGlobalEdit,
  LivePreview: null,
  References: null,
  Relationships: null,
  Version: null,
  Versions: null,
}

export const RenderCustomView = (
  args: GlobalEditViewProps & {
    view: globalViewType
  },
) => {
  const { globalConfig, view } = args

  const { admin: { components: { views: { Edit } = {} } = {} } = {} } = globalConfig

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
