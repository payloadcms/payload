import * as migration_20241205_161022_initial from './20241205_161022_initial'

export const migrations = [
  {
    up: migration_20241205_161022_initial.up,
    down: migration_20241205_161022_initial.down,
    name: '20241205_161022_initial',
  },
]
