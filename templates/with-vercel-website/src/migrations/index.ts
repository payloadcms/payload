import * as migration_20241206_203040_initial from './20241206_203040_initial'

export const migrations = [
  {
    up: migration_20241206_203040_initial.up,
    down: migration_20241206_203040_initial.down,
    name: '20241206_203040_initial',
  },
]
