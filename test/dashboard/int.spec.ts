import { expectTypeOf } from 'vitest'

import type {
  CollectionsWidget,
  Config,
  ConfigurableWidget,
  CountWidget,
  PageQueryWidget,
  PrivateWidget,
  RevenueWidget,
  Ticket,
} from './payload-types.js'

import { suite, test } from '../__helpers/int/vitest.js'

suite('Dashboard Widget Types', {}, () => {
  test('should add all widgets to Config', () => {
    expectTypeOf<Config['widgets']>().toEqualTypeOf<{
      collections: CollectionsWidget
      configurable: ConfigurableWidget
      count: CountWidget
      'page-query': PageQueryWidget
      private: PrivateWidget
      revenue: RevenueWidget
    }>()
  })

  test('should contain width and data on widget types', () => {
    expectTypeOf<CountWidget>().toHaveProperty('data')
    expectTypeOf<CountWidget>().toHaveProperty('width')
    expectTypeOf<CountWidget['width']>().toEqualTypeOf<'medium' | 'small' | 'x-small'>()
    expectTypeOf<CollectionsWidget['width']>().toEqualTypeOf<'full'>()
  })

  test('should mark widget data fields as required or optional', () => {
    type CountData = NonNullable<CountWidget['data']>
    type ConfigData = NonNullable<ConfigurableWidget['data']>

    expectTypeOf<CountData['title']>().toEqualTypeOf<string>()
    expectTypeOf<CountData['collection']>().toEqualTypeOf<
      ('events' | 'tickets') | null | undefined
    >()

    expectTypeOf<ConfigData['title']>().toEqualTypeOf<string>()
    expectTypeOf<ConfigData['description']>().toEqualTypeOf<null | string | undefined>()
    expectTypeOf<ConfigData['relatedTicket']>().toEqualTypeOf<
      (null | string) | Ticket | undefined
    >()
    expectTypeOf<NonNullable<ConfigData['nestedGroup']>['nestedText']>().toEqualTypeOf<
      null | string | undefined
    >()
  })
})
