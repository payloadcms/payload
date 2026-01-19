import * as migration_20260119_182432_initial from './20260119_182432_initial'

export const migrations = [
  {
    up: migration_20260119_182432_initial.up,
    down: migration_20260119_182432_initial.down,
    name: '20260119_182432_initial',
  },
]
