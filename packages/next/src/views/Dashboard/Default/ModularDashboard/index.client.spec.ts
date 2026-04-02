import type {
  DropTargetWidget as SharedDropTargetWidget,
  WidgetInstanceClient as SharedWidgetInstanceClient,
  WidgetItem as SharedWidgetItem,
} from '@payloadcms/ui'

import type {
  DropTargetWidget as NextDropTargetWidget,
  WidgetInstanceClient as NextWidgetInstanceClient,
  WidgetItem as NextWidgetItem,
} from './index.client.js'

import { describe, expect, expectTypeOf, it } from 'vitest'

import { ModularDashboardClient as SharedModularDashboardClient } from '@payloadcms/ui'

import { ModularDashboardClient as NextModularDashboardClient } from './index.client.js'

describe('ModularDashboardClient', () => {
  it('should reuse the shared ui implementation', () => {
    expect(NextModularDashboardClient).toBe(SharedModularDashboardClient)
  })

  it('should reuse the shared ui types', () => {
    expectTypeOf<NextDropTargetWidget>().toEqualTypeOf<SharedDropTargetWidget>()
    expectTypeOf<NextWidgetInstanceClient>().toEqualTypeOf<SharedWidgetInstanceClient>()
    expectTypeOf<NextWidgetItem>().toEqualTypeOf<SharedWidgetItem>()
  })
})
