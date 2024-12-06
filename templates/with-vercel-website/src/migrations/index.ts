import * as migration_20241205_211421_initial from './20241205_211421_initial'

export const migrations = [
  {
    up: migration_20241205_211421_initial.up,
    down: migration_20241205_211421_initial.down,
    name: '20241205_211421_initial',
  },
]
