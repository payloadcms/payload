import * as migration_20250821_183907_initial from './20250821_183907_initial'

export const migrations = [
  {
    up: migration_20250821_183907_initial.up,
    down: migration_20250821_183907_initial.down,
    name: '20250821_183907_initial',
  },
]
