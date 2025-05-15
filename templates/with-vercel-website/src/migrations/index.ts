import * as migration_20250515_185056_initial from './20250515_185056_initial'

export const migrations = [
  {
    up: migration_20250515_185056_initial.up,
    down: migration_20250515_185056_initial.down,
    name: '20250515_185056_initial',
  },
]
