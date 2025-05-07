import * as migration_20250404_194252_initial from './20250404_194252_initial'

export const migrations = [
  {
    up: migration_20250404_194252_initial.up,
    down: migration_20250404_194252_initial.down,
    name: '20250404_194252_initial',
  },
]
