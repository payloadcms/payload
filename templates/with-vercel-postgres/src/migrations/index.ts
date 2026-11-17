import * as migration_20261117_182410_initial from './20261117_182410_initial'

export const migrations = [
  {
    up: migration_20261117_182410_initial.up,
    down: migration_20261117_182410_initial.down,
    name: '20261117_182410_initial',
  },
]
