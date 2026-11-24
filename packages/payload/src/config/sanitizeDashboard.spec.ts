import type { Config, Widget } from './types.js'

import { expect, it } from 'vitest'

import { sanitizeConfig } from './sanitize.js'

function createConfig({ widgets }: { widgets: Widget[] }): Config {
  return {
    admin: { dashboard: { widgets } },
    db: { defaultIDType: 'text', init: () => undefined } as Config['db'],
    secret: 'secret',
  }
}

it('should keep one picker option per widget when a dashboard config is sanitized again', () => {
  const first = sanitizeConfig(
    createConfig({ widgets: [{ slug: 'custom', Component: './Custom' }] }),
  )
  const expected = first.admin.dashboard.widgets.map(({ slug }) => slug)
  const second = sanitizeConfig(createConfig({ widgets: first.admin.dashboard.widgets }))

  expect(second.admin.dashboard.widgets.map(({ slug }) => slug)).toEqual(expected)
})

it('should preserve the first configured widget when stale defaults contain duplicate slugs', () => {
  const widgets: Widget[] = [
    { slug: 'welcome', Component: './CustomWelcome', label: 'Custom welcome' },
    { slug: 'welcome', Component: '@payloadcms/ui/rsc#WelcomeWidget' },
  ]
  const sanitized = sanitizeConfig(createConfig({ widgets }))
  const matches = sanitized.admin.dashboard.widgets.filter(({ slug }) => slug === 'welcome')

  expect(matches).toHaveLength(1)
  expect(matches[0].Component).toBe('./CustomWelcome')
})
