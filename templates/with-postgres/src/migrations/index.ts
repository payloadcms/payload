import * as migration_20241213_192425_initial from './20241213_192425_initial'

export const migrations = [
  {
    up: migration_20241213_192425_initial.up,
    down: migration_20241213_192425_initial.down,
    name: '20241213_192425_initial',
  },
]
