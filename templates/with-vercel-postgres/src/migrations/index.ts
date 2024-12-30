import * as migration_20241221_130358_initial from './20241221_130358_initial'

export const migrations = [
  {
    up: migration_20241221_130358_initial.up,
    down: migration_20241221_130358_initial.down,
    name: '20241221_130358_initial',
  },
]
