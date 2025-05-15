import * as migration_20250515_185111_initial from './20250515_185111_initial'

export const migrations = [
  {
    up: migration_20250515_185111_initial.up,
    down: migration_20250515_185111_initial.down,
    name: '20250515_185111_initial',
  },
]
