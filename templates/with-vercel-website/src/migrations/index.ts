import * as migration_20260119_020224_initial from './20260119_020224_initial'

export const migrations = [
  {
    up: migration_20260119_020224_initial.up,
    down: migration_20260119_020224_initial.down,
    name: '20260119_020224_initial',
  },
]
