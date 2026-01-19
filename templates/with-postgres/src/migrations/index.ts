import * as migration_20260119_182440_initial from './20260119_182440_initial'

export const migrations = [
  {
    up: migration_20260119_182440_initial.up,
    down: migration_20260119_182440_initial.down,
    name: '20260119_182440_initial',
  },
]
