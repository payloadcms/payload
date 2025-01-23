import * as migration_20250123_184816_initial from './20250123_184816_initial'

export const migrations = [
  {
    up: migration_20250123_184816_initial.up,
    down: migration_20250123_184816_initial.down,
    name: '20250123_184816_initial',
  },
]
