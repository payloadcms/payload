import * as migration_20250123_184751_initial from './20250123_184751_initial'

export const migrations = [
  {
    up: migration_20250123_184751_initial.up,
    down: migration_20250123_184751_initial.down,
    name: '20250123_184751_initial',
  },
]
