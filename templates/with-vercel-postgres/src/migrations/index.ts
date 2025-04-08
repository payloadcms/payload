import * as migration_20250404_194215_initial from './20250404_194215_initial'

export const migrations = [
  {
    up: migration_20250404_194215_initial.up,
    down: migration_20250404_194215_initial.down,
    name: '20250404_194215_initial',
  },
]
