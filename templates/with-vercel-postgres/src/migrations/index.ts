import * as migration_20250821_183847_initial from './20250821_183847_initial'

export const migrations = [
  {
    up: migration_20250821_183847_initial.up,
    down: migration_20250821_183847_initial.down,
    name: '20250821_183847_initial',
  },
]
