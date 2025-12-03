import type { PayloadRequest } from '../../index.js'

export enum EntityType {
  collection = 'collections',
  global = 'globals',
}

export type WidgetServerProps = {
  req: PayloadRequest
  widgetData?: Record<string, unknown>
  widgetSlug: string
}
