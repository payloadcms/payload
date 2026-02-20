import type { InitReqResult } from '../../index.js'

export enum EntityType {
  collection = 'collections',
  global = 'globals',
}

type WidgetDataFromWidget<TWidget> = TWidget extends {
  data?: infer TData
}
  ? TData
  : never

export type WidgetServerProps<
  TWidget extends { data?: unknown } = { data?: Record<string, unknown> },
> = {
  widgetData?: WidgetDataFromWidget<TWidget> extends Record<string, unknown>
    ? WidgetDataFromWidget<TWidget>
    : Record<string, unknown>
  widgetSlug: string
} & Pick<InitReqResult, 'cookies' | 'locale' | 'permissions' | 'req'>
