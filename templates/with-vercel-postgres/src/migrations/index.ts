import * as migration_20260213_172605_initial from './20260213_172605_initial'

export const migrations = [
  {
    up: migration_20260213_172605_initial.up,
    down: migration_20260213_172605_initial.down,
    name: '20260213_172605_initial',
  },
]
