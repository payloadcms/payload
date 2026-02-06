import * as migration_20260205_211221_initial from './20260205_211221_initial'

export const migrations = [
  {
    up: migration_20260205_211221_initial.up,
    down: migration_20260205_211221_initial.down,
    name: '20260205_211221_initial',
  },
]
