import * as migration_20260119_182425_initial from './20260119_182425_initial'

export const migrations = [
  {
    up: migration_20260119_182425_initial.up,
    down: migration_20260119_182425_initial.down,
    name: '20260119_182425_initial',
  },
]
