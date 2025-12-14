import * as migration_20251214_201154_initial from './20251214_201154_initial'

export const migrations = [
  {
    up: migration_20251214_201154_initial.up,
    down: migration_20251214_201154_initial.down,
    name: '20251214_201154_initial',
  },
]
