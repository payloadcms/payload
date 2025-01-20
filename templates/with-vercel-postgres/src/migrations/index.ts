import * as migration_20250120_221134_initial from './20250120_221134_initial'

export const migrations = [
  {
    up: migration_20250120_221134_initial.up,
    down: migration_20250120_221134_initial.down,
    name: '20250120_221134_initial',
  },
]
