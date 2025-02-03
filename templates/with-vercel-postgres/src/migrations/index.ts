import * as migration_20250203_154437_initial from './20250203_154437_initial'

export const migrations = [
  {
    up: migration_20250203_154437_initial.up,
    down: migration_20250203_154437_initial.down,
    name: '20250203_154437_initial',
  },
]
