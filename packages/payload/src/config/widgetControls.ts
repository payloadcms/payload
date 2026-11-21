import type { I18nClient } from '@payloadcms/translations'
import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { createElement } from 'react'

import type { ImportMap } from '../cli/commands/generateImportMap/generateImportMap.js'
import type {
  ClientWidgetControl,
  ClientWidgetControlNode,
  PayloadComponent,
  WidgetControl,
  WidgetControlNode,
  WidgetLeafControl,
  WidgetNumberControl,
} from './types.js'

import { getFromImportMap } from '../cli/commands/generateImportMap/utilities/getFromImportMap.js'
import { isReactServerComponentOrFunction } from '../utilities/isReactComponent.js'
import { normalizeSliderValue } from '../utilities/normalizeSliderValue.js'

export function createClientWidgetControls({
  controls,
  i18n,
  importMap,
}: {
  controls?: WidgetControl[]
  i18n: I18nClient
  importMap: ImportMap
}): ClientWidgetControl[] | undefined {
  const resolveIcon = ({ Icon }: { Icon?: PayloadComponent }) => {
    const Component = Icon
      ? getFromImportMap<React.ComponentType>({ importMap, PayloadComponent: Icon })
      : undefined
    const props =
      typeof Icon === 'object'
        ? {
            ...(Component && isReactServerComponentOrFunction(Component) ? Icon.serverProps : {}),
            ...Icon.clientProps,
          }
        : {}

    return Component ? createElement(Component, props) : undefined
  }
  const resolveControl = (control: WidgetControlNode): ClientWidgetControlNode => {
    const result = {
      ...control,
      ...('Icon' in control ? { Icon: resolveIcon({ Icon: control.Icon }) } : {}),
      label: control.label === undefined ? undefined : getTranslation(control.label, i18n),
      ...('placeholder' in control && control.placeholder !== undefined
        ? { placeholder: getTranslation(control.placeholder, i18n) }
        : {}),
      ...('controls' in control ? { controls: control.controls.map(resolveControl) } : {}),
      ...('options' in control
        ? {
            options: control.options.map((option) =>
              typeof option === 'string'
                ? option
                : {
                    ...option,
                    ...('Icon' in option ? { Icon: resolveIcon({ Icon: option.Icon }) } : {}),
                    label: getTranslation(option.label, i18n),
                  },
            ),
          }
        : {}),
    }

    return result as ClientWidgetControlNode
  }

  return controls?.map(resolveControl) as ClientWidgetControl[] | undefined
}

/** Collect value-bearing controls; groups and popouts are presentation only. */
export function getWidgetControlFields({
  controls,
}: {
  controls?: WidgetControlNode[]
}): WidgetLeafControl[] {
  return (
    controls?.flatMap((control) =>
      'controls' in control ? getWidgetControlFields({ controls: control.controls }) : [control],
    ) ?? []
  )
}

type ControlDefaults = {
  controls?: ControlDefaults[]
  defaultValue?: boolean | number | string
  max?: number
  min?: number
  name?: string
  slider?: WidgetNumberControl['slider']
  step?: number
}

export function getWidgetControlData({
  controls,
  data = {},
}: {
  controls?: ControlDefaults[]
  data?: Record<string, unknown>
}): Record<string, unknown> {
  const result = { ...data }
  const applyDefaults = ({ controls }: { controls?: ControlDefaults[] }) => {
    for (const control of controls ?? []) {
      if (control.controls) {
        applyDefaults({ controls: control.controls })
      } else if (
        control.name &&
        result[control.name] === undefined &&
        control.defaultValue !== undefined
      ) {
        result[control.name] = control.defaultValue
      }
      if (
        control.name &&
        control.slider &&
        typeof result[control.name] === 'number' &&
        control.min !== undefined &&
        control.max !== undefined
      ) {
        result[control.name] = normalizeSliderValue({
          max: control.max,
          min: control.min,
          step: control.step ?? 1,
          value: result[control.name] as number,
        })
      }
    }
  }

  applyDefaults({ controls })
  return result
}
