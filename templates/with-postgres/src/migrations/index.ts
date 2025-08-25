import * as migration_20250821_183927_initial from './20250821_183927_initial'

export const migrations = [
  {
    up: migration_20250821_183927_initial.up,
    down: migration_20250821_183927_initial.down,
    name: '20250821_183927_initial',
  },
]
