import type { ClientWidget } from 'payload'

import type { WidgetItem } from '../index.client.js'
import type { WidgetDropSizing } from './getValidSideDropTargets.js'

import { getWidgetDropSizing } from './getValidSideDropTargets.js'
import { getWidgetIDFromDropTarget } from './getWidgetMoveIndexes.js'

export const EMPTY_DASHBOARD_DROP_ID = 'dashboard-empty-drop'

export type DrawerWidgetDragData = {
  drawerSlug: string
  type: 'dashboard-widget'
  widget: ClientWidget
}

export function getDrawerWidgetDragID({ slug }: { slug: string }): string {
  return `dashboard-picker:${slug}:source`
}

export function getDrawerWidgetDragData({ data }: { data: unknown }): DrawerWidgetDragData | null {
  if (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    data.type === 'dashboard-widget' &&
    'drawerSlug' in data &&
    typeof data.drawerSlug === 'string' &&
    'widget' in data &&
    data.widget &&
    typeof data.widget === 'object' &&
    'slug' in data.widget &&
    typeof data.widget.slug === 'string'
  ) {
    return data as DrawerWidgetDragData
  }

  return null
}

export function getDrawerWidgetItem({ widget }: { widget: ClientWidget }): WidgetItem {
  return {
    id: getDrawerWidgetDragID({ slug: widget.slug }),
    maxWidth: widget.maxWidth ?? 'full',
    minWidth: widget.minWidth ?? 'x-small',
    width: widget.minWidth ?? 'x-small',
  }
}

export function getDrawerWidgetDrop({
  layout,
  overID,
  widget,
}: {
  layout: WidgetItem[]
  overID: string
  widget: ClientWidget
}): ({ index: number } & WidgetDropSizing) | null {
  const activeWidget = getDrawerWidgetItem({ widget })

  if (overID === EMPTY_DASHBOARD_DROP_ID && layout.length === 0) {
    return { index: 0, width: activeWidget.width }
  }

  const targetID = getWidgetIDFromDropTarget({ id: overID })
  const targetIndex = layout.findIndex(({ id }) => id === targetID)
  const sizing = getWidgetDropSizing({ activeID: activeWidget.id, activeWidget, layout, overID })

  if (targetIndex < 0 || sizing === null) {
    return null
  }

  return { index: targetIndex + (overID.endsWith('-after') ? 1 : 0), ...sizing }
}
