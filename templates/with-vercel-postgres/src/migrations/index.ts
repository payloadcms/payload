import * as migration_20241206_203025_initial from './20241206_203025_initial'

export const migrations = [
  {
    up: migration_20241206_203025_initial.up,
    down: migration_20241206_203025_initial.down,
    name: '20241206_203025_initial',
  },
]
