import * as migration_20250311_214602_initial from './20250311_214602_initial'

export const migrations = [
  {
    up: migration_20250311_214602_initial.up,
    down: migration_20250311_214602_initial.down,
    name: '20250311_214602_initial',
  },
]
