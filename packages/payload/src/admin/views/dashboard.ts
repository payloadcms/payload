import type { DataFromWidgetSlug, InitReqResult, WidgetSlug } from '../../index.js'

export enum EntityType {
  collection = 'collections',
  global = 'globals',
}

type WidgetDataFromSlug<TSlug extends WidgetSlug> =
  DataFromWidgetSlug<TSlug> extends {
    data?: infer TData
  }
    ? TData
    : DataFromWidgetSlug<TSlug>

export type WidgetServerProps<TSlug extends WidgetSlug = WidgetSlug> = {
  widgetData?: WidgetDataFromSlug<TSlug> extends Record<string, unknown>
    ? WidgetDataFromSlug<TSlug>
    : Record<string, unknown>
  widgetSlug: TSlug
} & Pick<InitReqResult, 'cookies' | 'locale' | 'permissions' | 'req'>
