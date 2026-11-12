import type { I18nClient } from '@payloadcms/translations'
import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { createElement } from 'react'

import type { ImportMap } from '../cli/commands/generateImportMap/generateImportMap.js'
import type { ClientWidgetControl, WidgetControl } from './types.js'

import { getFromImportMap } from '../cli/commands/generateImportMap/utilities/getFromImportMap.js'
import { isReactServerComponentOrFunction } from '../utilities/isReactComponent.js'

export function createClientWidgetControls({
  controls,
  i18n,
  importMap,
}: {
  controls?: WidgetControl[]
  i18n: I18nClient
  importMap: ImportMap
}): ClientWidgetControl[] | undefined {
  return controls?.map(({ Icon, ...control }) => {
    const ResolvedIcon = Icon
      ? getFromImportMap<React.ComponentType>({ importMap, PayloadComponent: Icon })
      : undefined
    const iconProps =
      typeof Icon === 'object'
        ? {
            ...(ResolvedIcon && isReactServerComponentOrFunction(ResolvedIcon)
              ? Icon.serverProps
              : {}),
            ...Icon.clientProps,
          }
        : {}

    return {
      ...control,
      ...(ResolvedIcon ? { Icon: createElement(ResolvedIcon, iconProps) } : {}),
      label: control.label === undefined ? undefined : getTranslation(control.label, i18n),
      options: control.options.map((option) =>
        typeof option === 'string'
          ? option
          : { ...option, label: getTranslation(option.label, i18n) },
      ),
    }
  })
}

export function getWidgetControlData({
  controls,
  data = {},
}: {
  controls?: Pick<WidgetControl, 'defaultValue' | 'name'>[]
  data?: Record<string, unknown>
}): Record<string, unknown> {
  const result = { ...data }

  for (const control of controls ?? []) {
    if (result[control.name] === undefined && control.defaultValue !== undefined) {
      result[control.name] = control.defaultValue
    }
  }

  return result
}
