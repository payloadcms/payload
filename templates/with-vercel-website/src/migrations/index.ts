import * as migration_20250925_170133_initial from './20250925_170133_initial'

export const migrations = [
  {
    up: migration_20250925_170133_initial.up,
    down: migration_20250925_170133_initial.down,
    name: '20250925_170133_initial',
  },
]
