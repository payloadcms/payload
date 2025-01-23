import * as migration_20250123_184805_initial from './20250123_184805_initial'

export const migrations = [
  {
    up: migration_20250123_184805_initial.up,
    down: migration_20250123_184805_initial.down,
    name: '20250123_184805_initial',
  },
]
