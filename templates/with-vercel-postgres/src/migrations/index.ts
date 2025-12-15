import * as migration_20251215_201650_initial from './20251215_201650_initial'

export const migrations = [
  {
    up: migration_20251215_201650_initial.up,
    down: migration_20251215_201650_initial.down,
    name: '20251215_201650_initial',
  },
]
