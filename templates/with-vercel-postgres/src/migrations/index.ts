import * as migration_20250515_185040_initial from './20250515_185040_initial'

export const migrations = [
  {
    up: migration_20250515_185040_initial.up,
    down: migration_20250515_185040_initial.down,
    name: '20250515_185040_initial',
  },
]
