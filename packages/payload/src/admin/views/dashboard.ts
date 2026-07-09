import type { InitReqResult, TypedWidget, WidgetSlug } from '../../index.js'
import type { ComponentRenderer } from '../adapters/render.js'

export enum EntityType {
  collection = 'collections',
  global = 'globals',
}

type WidgetDataFromWidget<TWidget> = TWidget extends {
  data?: infer TData
}
  ? TData
  : never

type WidgetSlugFromWidget<TWidget extends { data?: unknown }> = {
  [TSlug in WidgetSlug]: TypedWidget[TSlug] extends TWidget ? TSlug : never
}[WidgetSlug]

export type WidgetServerProps<TWidget extends { data?: unknown } | never = never> = {
  /**
   * Adapter-injected component renderer. Widget server components can use
   * this to render other import map components without importing a
   * framework-specific renderer directly.
   */
  renderComponent?: ComponentRenderer
  widgetData?: [TWidget] extends [never]
    ? Record<string, unknown>
    : WidgetDataFromWidget<Exclude<TWidget, never>> extends Record<string, unknown>
      ? WidgetDataFromWidget<Exclude<TWidget, never>>
      : Record<string, unknown>
  widgetSlug: [TWidget] extends [never]
    ? string
    : [WidgetSlugFromWidget<{ data?: unknown } & Exclude<TWidget, never>>] extends [never]
      ? string
      : WidgetSlugFromWidget<{ data?: unknown } & Exclude<TWidget, never>>
} & Pick<InitReqResult, 'cookies' | 'locale' | 'permissions' | 'req'>
