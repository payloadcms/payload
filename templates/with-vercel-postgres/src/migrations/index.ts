import * as migration_20241205_211405_initial from './20241205_211405_initial'

export const migrations = [
  {
    up: migration_20241205_211405_initial.up,
    down: migration_20241205_211405_initial.down,
    name: '20241205_211405_initial',
  },
]
