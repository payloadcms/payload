import type { TFunction } from '@ruya.sa/translations'
import type {
  BasePayload,
  ClientWidget,
  DashboardConfig,
  PayloadRequest,
  TypedUser,
  Widget,
  WidgetInstance,
  WidgetServerProps,
} from '@ruya.sa/payload'

import { RenderServerComponent } from '@ruya.sa/ui/elements/RenderServerComponent'
import React from 'react'

import type { DashboardViewServerProps } from '../index.js'
import type { WidgetInstanceClient, WidgetItem } from './index.client.js'

import { getPreferences } from '../../../../utilities/getPreferences.js'
import { ModularDashboardClient } from './index.client.js'
import './index.scss'

type ServerLayout = WidgetInstanceClient[]

export async function ModularDashboard(props: DashboardViewServerProps) {
  const { defaultLayout = [], widgets = [] } = props.payload.config.admin.dashboard || {}
  const { importMap } = props.payload
  const { user } = props
  const { req } = props.initPageResult
  const { i18n } = req

  const layout =
    (await getItemsFromPreferences(props.payload, user)) ??
    (await getItemsFromConfig(defaultLayout, req, widgets))

  const serverLayout: ServerLayout = layout.map((layoutItem) => {
    const widgetSlug = layoutItem.id.slice(0, layoutItem.id.lastIndexOf('-'))
    return {
      component: RenderServerComponent({
        Component: widgets.find((widget) => widget.slug === widgetSlug)?.ComponentPath,
        importMap,
        serverProps: {
          req,
          widgetSlug,
          // TODO: widgets will support state in the future
          // widgetData: layoutItem.data,
        } satisfies WidgetServerProps,
      }),
      item: layoutItem,
    }
  })

  // Resolve function labels to static labels for client components
  const clientWidgets: ClientWidget[] = widgets.map((widget) => {
    const { ComponentPath: _, label, ...rest } = widget
    return {
      ...rest,
      label: typeof label === 'function' ? label({ i18n, t: i18n.t as TFunction }) : label,
    }
  })

  return (
    <div>
      <ModularDashboardClient clientLayout={serverLayout} widgets={clientWidgets} />
    </div>
  )
}

async function getItemsFromPreferences(
  payload: BasePayload,
  user: TypedUser,
): Promise<null | WidgetItem[]> {
  const savedPreferences = await getPreferences(
    'dashboard-layout',
    payload,
    user.id,
    user.collection,
  )
  if (
    !savedPreferences?.value ||
    typeof savedPreferences.value !== 'object' ||
    !('layouts' in savedPreferences.value)
  ) {
    return null
  }
  return savedPreferences.value.layouts as null | WidgetItem[]
}

async function getItemsFromConfig(
  defaultLayout: NonNullable<DashboardConfig['defaultLayout']>,
  req: PayloadRequest,
  widgets: Widget[],
): Promise<WidgetItem[]> {
  // Handle function format
  let widgetInstances: WidgetInstance[]
  if (typeof defaultLayout === 'function') {
    widgetInstances = await defaultLayout({ req })
  } else {
    widgetInstances = defaultLayout
  }

  return widgetInstances.map((widgetInstance, index) => {
    const widget = widgets.find((widget) => widget.slug === widgetInstance.widgetSlug)
    return {
      id: `${widgetInstance.widgetSlug}-${index}`,
      maxWidth: widget?.maxWidth ?? 'full',
      minWidth: widget?.minWidth ?? 'x-small',
      width: widgetInstance.width || 'x-small',
    }
  })
}
