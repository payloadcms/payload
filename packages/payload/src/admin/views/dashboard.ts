import type { InitReqResult } from '../../index.js'

export enum EntityType {
  collection = 'collections',
  global = 'globals',
}

export type WidgetServerProps = {
  widgetData?: Record<string, unknown>
  widgetSlug: string
} & Pick<InitReqResult, 'cookies' | 'locale' | 'permissions' | 'req'>
