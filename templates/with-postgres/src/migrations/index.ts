import * as migration_20241219_223803_initial from './20241219_223803_initial'

export const migrations = [
  {
    up: migration_20241219_223803_initial.up,
    down: migration_20241219_223803_initial.down,
    name: '20241219_223803_initial',
  },
]
