import * as migration_20260213_172637_initial from './20260213_172637_initial'

export const migrations = [
  {
    up: migration_20260213_172637_initial.up,
    down: migration_20260213_172637_initial.down,
    name: '20260213_172637_initial',
  },
]
