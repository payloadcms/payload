import * as migration_20241221_130412_initial from './20241221_130412_initial'

export const migrations = [
  {
    up: migration_20241221_130412_initial.up,
    down: migration_20241221_130412_initial.down,
    name: '20241221_130412_initial',
  },
]
