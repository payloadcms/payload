import type { InitReqResult, TypedWidget, WidgetSlug } from '../../index.js'

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

export type WidgetServerProps<TWidget extends never | { data?: unknown } = never> = Pick<
  InitReqResult,
  'cookies' | 'locale' | 'permissions' | 'req'
> & {
  widgetData?: [TWidget] extends [never]
    ? Record<string, unknown>
    : WidgetDataFromWidget<Exclude<TWidget, never>> extends Record<string, unknown>
      ? WidgetDataFromWidget<Exclude<TWidget, never>>
      : Record<string, unknown>
  widgetSlug: [TWidget] extends [never]
    ? string
    : [WidgetSlugFromWidget<Exclude<TWidget, never> & { data?: unknown }>] extends [never]
      ? string
      : WidgetSlugFromWidget<Exclude<TWidget, never> & { data?: unknown }>
}
