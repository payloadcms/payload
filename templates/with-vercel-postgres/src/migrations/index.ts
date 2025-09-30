import * as migration_20250930_133643_initial from './20250930_133643_initial'

export const migrations = [
  {
    up: migration_20250930_133643_initial.up,
    down: migration_20250930_133643_initial.down,
    name: '20250930_133643_initial',
  },
]
