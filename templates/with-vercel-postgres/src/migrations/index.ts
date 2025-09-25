import * as migration_20250925_170113_initial from './20250925_170113_initial'

export const migrations = [
  {
    up: migration_20250925_170113_initial.up,
    down: migration_20250925_170113_initial.down,
    name: '20250925_170113_initial',
  },
]
