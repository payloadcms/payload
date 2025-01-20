import * as migration_20250120_221147_initial from './20250120_221147_initial'

export const migrations = [
  {
    up: migration_20250120_221147_initial.up,
    down: migration_20250120_221147_initial.down,
    name: '20250120_221147_initial',
  },
]
