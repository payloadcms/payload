import * as migration_20250925_170153_initial from './20250925_170153_initial'

export const migrations = [
  {
    up: migration_20250925_170153_initial.up,
    down: migration_20250925_170153_initial.down,
    name: '20250925_170153_initial',
  },
]
