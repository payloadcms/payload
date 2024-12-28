import * as migration_20241228_171127_initial from './20241228_171127_initial'

export const migrations = [
  {
    up: migration_20241228_171127_initial.up,
    down: migration_20241228_171127_initial.down,
    name: '20241228_171127_initial',
  },
]
